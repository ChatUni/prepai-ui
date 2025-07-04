import { makeAutoObservable, runInAction } from 'mobx';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { save } from '../utils/db';
import languageStore from './languageStore';
import { omit } from '../utils/omit';
import editCourseStore from './editCourseStore';
import clientStore from './clientStore';

class EditSeriesStore {
  // fields
  name = '';
  category = '';
  group = '';
  price = '';
  duration = '30days';
  descType = 'text';
  description = '';
  image = '';
  descImage = '';
  courses = [];
  
  // state
  isLoading = false;
  error = null;
  editingSeries = null;
  isDropdownOpen = false;
  currentStep = 1;
  editCourseDialogOpen = false;
  currentEditCourse = null;

  durationOptions = [
    { key: '30days', value: '30 Days' },
    { key: '60days', value: '60 Days' },
    { key: '90days', value: '90 Days' },
    { key: '180days', value: '180 Days' },
    { key: '365days', value: '365 Days' }
  ];

  constructor() {
    makeAutoObservable(this);
  }

  get stepTitles() {
    const { t } = languageStore;
    return [
      t('series.edit.steps.selectGroup'),
      t('series.edit.steps.nameAndCategory'),
      t('series.edit.steps.cover'),
      t('series.edit.steps.description'),
      t('series.edit.steps.priceAndDuration')
    ];
  }

  setName = (name) => {
    this.name = name;
  }

  setCategory = (category) => {
    this.category = category;
    this.isDropdownOpen = false;
  }

  setGroup = (group) => {
    this.group = group;
  }

  setPrice = (price) => {
    this.price = price;
  }

  setDuration = (duration) => {
    this.duration = duration;
  }

  setDescType = (type) => {
    this.descType = type;
  }

  setDescription = (desc) => {
    this.description = desc;
  }

  setImage = (file) => {
    this.image = file;
  }

  setDescImage = (file) => {
    this.descImage = file;
  }

  setCourses = (courses) => {
    this.courses = courses;
  }

  get totalSteps() {
    return this.stepTitles.length;
  }

  nextStep = () => {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep = () => {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  setStep = (step) => {
    this.currentStep = step;
  }

  get canProceedToStep2() {
    return this.group !== '';
  }

  get canProceedToStep3() {
    return this.name !== '' && this.category !== '';
  }

  get canProceedToStep4() {
    return this.image !== '';
  }

  get canProceedToStep5() {
    return (this.descType === 'text' && this.description !== '') ||
           (this.descType === 'image' && this.descImage !== '');
  }

  get canSave() {
    return (
      this.name &&
      this.price &&
      this.duration &&
      ((this.descType === 'text' && this.description) ||
        (this.descType === 'image' && this.descImage))
    );
  }

  setError = (error) => {
    this.error = error;
  }

  clearError = () => {
    this.error = null;
  }

  validateStep = async (step) => {
    const { t } = languageStore;
    switch (step) {
      case 1:
        if (!this.canProceedToStep2) {
          return t('series.edit.errors.groupRequired');
        }
        break;
      case 2:
        if (!this.canProceedToStep3) {
          return t('series.edit.errors.nameAndCategoryRequired');
        }
        await this.saveSeries(true);
        break;
      case 3:
        if (!this.canProceedToStep4) {
          return t('series.edit.errors.coverImageRequired');
        }
        break;
      case 4:
        if (!this.canProceedToStep5) {
          if (this.descType === 'text') {
            return t('series.edit.errors.descriptionRequired');
          }
          return t('series.edit.errors.descriptionImageRequired');
        }
        break;
      case 5:
        if (!this.canSave) {
          return t('series.edit.errors.priceAndDurationRequired');
        }
        await this.saveSeries(true);
        break;
      case 6:
        if (!this.courses || this.courses.length === 0) {
          return t('series.edit.errors.coursesRequired');
        }
        break;
    }
    return null;
  }

  toggleDropdown = () => {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown = () => {
    this.isDropdownOpen = false;
  }

  reset = (series = null) => {
    this.editingSeries = series;
    this.name = series?.name || '';
    this.category = series?.category || '';
    this.group = series?.group || '';
    this.price = series?.price || '';
    this.duration = series?.duration || '30days';
    this.descType = series?.desc.startsWith('http') ? 'image' : 'text';
    this.description = series?.desc || '';
    this.image = series?.cover || '';
    this.descImage = this.descType === 'image' ? series?.desc : '';
    this.courses = series?.courses || [];
    this.isLoading = false;
    this.error = null;
    this.currentStep = 1;
    this.isDropdownOpen = false;
  }

  openEditCourseDialog = (course) => {
    this.currentEditCourse = course;
    editCourseStore.reset(course);
    this.editCourseDialogOpen = true;
  }

  closeEditCourseDialog = () => {
    this.editCourseDialogOpen = false;
    this.currentEditCourse = null;
    editCourseStore.reset(null);
  }

  uploadImage = async (file, path) => {
    try {
      return await uploadToCloudinary(file, path);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  }

  saveSeries = async (isBackground) => {
    try {
      this.error = null;
      if (!isBackground) this.isLoading = true;

      const isEdit = !!this.editingSeries;

      const seriesData = omit({
        ...(isEdit ? this.editingSeries : {}),
        client_id: clientStore.client.id,
        name: this.name,
        category: this.category,
        group: this.group,
        price: Number(this.price),
        duration: this.duration,
        desc: this.descType === 'text' ? this.description : this.descImage,
        [`date_${isEdit ? 'modified' : 'added'}`]: new Date()
      }, ['_id', 'courses', 'isPaid']);

      // Save new series to get id
      if (!isEdit) {
        const data = await save('series', seriesData);
        seriesData.id = data.id;
        this.editingSeries = seriesData;
      }

      // Handle cover image upload
      if (this.image instanceof File) {
        const coverUrl = await this.uploadImage(this.image, `series/${seriesData.id}`);
        seriesData.cover = coverUrl;
      }

      // Handle description image upload
      if (this.descType === 'image' && this.descImage instanceof File) {
        const descImageUrl = await this.uploadImage(this.descImage, `series/${seriesData.id}`);
        seriesData.desc = descImageUrl;
      }

      await save('series', seriesData);

      if (!isBackground) {
        this.isLoading = false;
        this.reset();
      }

      return seriesData;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  }

  updateCourse = async () => {
    try {
      const course = await editCourseStore.saveCourse(this.editingSeries?.id);
      
      runInAction(() => {
        const courses = [...this.courses];
        const existingIndex = courses.findIndex(c => c.id === course.id);
        
        if (existingIndex >= 0) {
          // Replace existing course
          courses[existingIndex] = course;
        } else {
          // Add new course to the end
          courses.push(course);
        }
        
        this.courses = courses;
        this.closeEditCourseDialog();
      });

      return course;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  }
}

const editSeriesStore = new EditSeriesStore();
export default editSeriesStore;