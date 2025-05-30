import { makeAutoObservable, runInAction } from 'mobx';
import seriesStore from './seriesStore';
import routeStore from './routeStore';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { uploadToCOS } from '../utils/cosHelper';
import { save } from '../utils/db';
import _ from 'lodash';

class EditCourseStore {
  // fields
  title = '';
  image = null;
  url = null;
  instructor_id = null;
  duration = 0;

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
  }

  setUrl = (data) => {
    if (data?.isFile) {
      this.url = data;
    } else {
      this.url = data;
    }
  }

  setDuration = (duration) => {
    this.duration = duration;
  }

  setInstructorId = (id) => {
    this.instructor_id = id;
  }

  reset = (course = null) => {
    this.editingCourse = course;
    this.title = course?.title || '';
    this.image = course?.image || '';
    this.url = course?.url || '';
    this.instructor_id = course?.instructor_id;
    this.duration = course?.duration || 0;
    this.isLoading = false;
    this.error = null;
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
        isVideo: true,
        [`date_${isEdit ? 'modified' : 'added'}`]: new Date()
      }, ['_id', 'series', 'instructor']);

      // Save new course to get id
      if (!isEdit) {
        const data = await save('courses', courseData)
        courseData.id = data.id;
      }

      if (this.url?.isFile) {
        const key = `series/${seriesId}/courses/${Date.now()}-${this.url.file.name}`;
        const url = await uploadToCOS(this.url.file, key);
        courseData.url = url;
      } else if (typeof this.url === 'string') {
        courseData.url = this.url;
      }

      if (this.image?.isFile) {
        const key = `series/${seriesId}/courses/${Date.now()}-${this.image.file.name}`;
        const coverUrl = await uploadToCOS(this.image.file, key);
        courseData.image = coverUrl;
      } else if (typeof this.image === 'string') {
        courseData.image = this.image;
      }

      // Save updated course
      await save('courses', courseData)

      runInAction(() => {
        this.isLoading = false;
        this.reset();
      });

      return courseData;
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
