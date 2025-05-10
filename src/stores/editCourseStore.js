import { makeAutoObservable, runInAction } from 'mobx';
import seriesStore from './seriesStore';
import routeStore from './routeStore';

class EditCourseStore {
  title = '';
  image = null;
  imagePreview = null;
  videoFile = null;
  instructor_id = null;
  duration = 0;
  isLoading = false;
  error = null;
  editingCourseId = null;

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
      reader.readAsDataURL(file);
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

  reset = () => {
    this.title = '';
    this.image = null;
    this.imagePreview = null;
    this.videoFile = null;
    this.instructor_id = null;
    this.duration = 0;
    this.error = null;
    this.editingCourseId = null;
  }

  loadCourse = async (courseId) => {
    try {
      this.isLoading = true;
      this.error = null;
      this.editingCourseId = courseId;

      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to load course');
      const course = await response.json();
      
      runInAction(() => {
        this.title = course.title;
        this.instructor_id = course.instructor_id;
        this.imagePreview = course.image;
        this.duration = course.duration || 0;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  setInstructorId = (id) => {
    this.instructor_id = id;
  }

  saveCourse = async (seriesId, navigate) => {
    try {
      this.isLoading = true;
      this.error = null;

      // First upload video to get URL
      let videoUrl = null;
      if (this.videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', this.videoFile);
        videoFormData.append('folder', `prepai/${seriesId}/courses`);

        const videoResponse = await fetch('/api/cloudinary_upload', {
          method: 'POST',
          body: videoFormData
        });

        if (!videoResponse.ok) {
          throw new Error('Failed to upload video');
        }

        const videoData = await videoResponse.json();
        videoUrl = videoData.secure_url;
      }

      // Upload cover image if provided
      let coverUrl = null;
      if (this.coverImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', this.coverImage);
        imageFormData.append('folder', `prepai/${seriesId}/courses`);

        const imageResponse = await fetch('/api/cloudinary_upload', {
          method: 'POST',
          body: imageFormData
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to upload cover image');
        }

        const imageData = await imageResponse.json();
        coverUrl = imageData.secure_url;
      }

      // Save course data
      const courseData = {
        title: this.title,
        series_id: seriesId,
        instructor_id: this.instructor_id,
        video_url: videoUrl,
        image: coverUrl || this.imagePreview,
        duration: this.duration,
        isVideo: !!videoUrl
      };

      const response = await fetch(`/api/courses${this.editingCourseId ? `/${this.editingCourseId}` : ''}`, {
        method: this.editingCourseId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to save course');
      }

      const data = await response.json();
      
      runInAction(() => {
        this.isLoading = false;
        this.reset();
        routeStore.navigateToSeries(seriesId, navigate);
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
