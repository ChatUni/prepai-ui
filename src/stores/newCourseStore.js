import { makeAutoObservable, runInAction } from 'mobx';
import seriesStore from './seriesStore';
import routeStore from './routeStore';

class NewCourseStore {
  name = '';
  description = '';
  coverImage = null;
  coverImagePreview = null;
  videoFile = null;
  instructorId = null;
  isLoading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  setName = (name) => {
    this.name = name;
  }

  setDescription = (description) => {
    this.description = description;
  }

  setCoverImage = (file) => {
    this.coverImage = file;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        runInAction(() => {
          this.coverImagePreview = reader.result;
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.coverImagePreview = null;
    }
  }

  setVideoFile = (file) => {
    this.videoFile = file;
  }

  reset = () => {
    this.name = '';
    this.description = '';
    this.coverImage = null;
    this.coverImagePreview = null;
    this.videoFile = null;
    this.instructorId = null;
    this.error = null;
  }

  setInstructorId = (id) => {
    this.instructorId = id;
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
        name: this.name,
        description: this.description,
        series_id: seriesId,
        instructor_id: this.instructorId,
        video_url: videoUrl,
        cover_image: coverUrl,
        isVideo: !!videoUrl
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
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

const newCourseStore = new NewCourseStore();
export default newCourseStore;