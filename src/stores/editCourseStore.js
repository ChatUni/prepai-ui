import { makeAutoObservable, runInAction } from 'mobx';
import seriesStore from './seriesStore';
import routeStore from './routeStore';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { save } from '../utils/db';
import _ from 'lodash';

class EditCourseStore {
  // fields
  title = '';
  image = null;
  instructor_id = null;
  duration = 0;

  // data
  imagePreview = null;
  videoFile = null;

  // state
  isLoading = false;
  error = null;
  editingCourse = null;

  constructor() {
    makeAutoObservable(this);
  }

  setTitle = (title) => {
    this.title = title;
  }

  setImage = (file) => {
    this.image = file;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        runInAction(() => {
          this.imagePreview = reader.result;
        });
      };
      reader.re.readAsDataURL(file);
    } else {
      this.imagePreview = null;
    }
  }

  setDuration = (duration) => {
    this.duration = duration;
  }

  setVideoFile = (file) => {
    this.videoFile = file;
  }

  reset = (course = null) => {
    this.editingCourse = course;
    this.title = course?.title || '';
    this.image = this.imagePreview = course?.image;
    this.videoFile = course?.url;
    this.instructor_id = course?.instructor_id;
    this.duration = course?.duration || 0;
    this.isLoading = false;
    this.error = null;
  }

  setInstructorId = (id) => {
    this.instructor_id = id;
  }

  saveCourse = async (seriesId) => {
    try {
      this.isLoading = true;
      this.error = null;

      const isEdit = !!this.editingCourse;

      const courseData = _.omit({
        ...(isEdit ? this.editingCourse : {}),
        series_id: seriesId,
        instructor_id: this.instructor_id,
        title: this.title,
        duration: this.duration,
        [`date_${isEdit ? 'modified' : 'added'}`]: new Date()
      }, ['series', 'instructor']);

      // Save new course to get id
      if (!isEdit) {
        const data = await save('courses', courseData)
        courseData.id = data.id;
      }

      // Upload video if provided
      let videoUrl = null;
      if (this.videoFile) {
        videoUrl = await uploadToCloudinary(this.videoFile, `prepai/${seriesId}/courses`);
      }

      // Upload cover image if provided
      let coverUrl = null;
      if (this.image) {
        coverUrl = await uploadToCloudinary(this.image, `prepai/${seriesId}/courses`);
      }

      courseData.url = videoUrl;
      courseData.image = coverUrl;
      courseData.isVideo = true;

      // Save updated course
      await save('courses', courseData)

      runInAction(() => {
        this.isLoading = false;
        this.reset();
      });

      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  }
}

const editCourseStore = new EditCourseStore();
export default editCourseStore;
