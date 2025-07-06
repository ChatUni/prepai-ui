import { makeAutoObservable, runInAction } from 'mobx';
import { getApiBaseUrl } from '../config';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import clientStore from './clientStore';
import instructorsStore from './instructorStore';
import { save } from '../utils/db';

class EditInstructorStore {
  // fields
  name = '';
  title = '';
  bio = '';
  expertise = '';
  image = '';

  // state
  isLoading = false;
  error = null;
  editingInstructor = null;

  constructor() {
    makeAutoObservable(this);
  }

  setName = (name) => {
    this.name = name;
  }

  setTitle = (title) => {
    this.title = title;
  }

  setBio = (bio) => {
    this.bio = bio;
  }

  setExpertise = (expertise) => {
    this.expertise = expertise;
  }

  setImage = (file) => {
    this.image = file;
  }

  reset = (instructor = null) => {
    this.editingInstructor = instructor;
    this.name = instructor?.name || '';
    this.title = instructor?.title || '';
    this.bio = instructor?.bio || '';
    this.expertise = instructor?.expertise || '';
    this.image = instructor?.image || '';
    this.isLoading = false;
    this.error = null;
  }

  uploadInstructorIcon = async (file, instructorId) => {
    try {
      return await uploadToCloudinary(file, `instructors/${instructorId}`);
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
      });
      throw error;
    }
  }

  saveInstructor = async () => {
    try {
      this.isLoading = true;
      this.error = null;

      const isEdit = !!this.editingInstructor;

      const instructorData = {
        ...(isEdit ? this.editingInstructor : {}),
        name: this.name,
        title: this.title,
        bio: this.bio,
        expertise: this.expertise,
        image: this.image,
        client_id: clientStore.client.id,
        [`date_${isEdit ? 'modified' : 'added'}`]: new Date()
      };

      // Save new instructor to get id
      if (!isEdit) {
        const data = await save('instructors', instructorData);
        instructorData.id = data.id;
      }

      // If there's a new icon file, upload it
      if (this.image instanceof File) {
        const imageUrl = await this.uploadInstructorIcon(this.image, instructorData.id);
        instructorData.image = imageUrl;
      }

      await save('instructors', instructorData);

      this.isLoading = false;
      this.reset();

      return instructorData;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.isLoading = false;
      });
      throw error;
    }
  }
}

const editInstructorStore = new EditInstructorStore();
export default editInstructorStore;