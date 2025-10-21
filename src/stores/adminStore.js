import { makeAutoObservable } from 'mobx';

class AdminStore {
  currentMenu = 'main';

  constructor() {
    makeAutoObservable(this);
  }

  setCurrentMenu = (menu) => {
    this.currentMenu = menu;
  };

  handleSystemSettingsClick = () => {
    this.setCurrentMenu('system-settings');
  };

  handleBackClick = (navigate) => {
    if (this.currentMenu === 'system-settings') {
      // If on 2nd level, go back to 1st level
      this.setCurrentMenu('main');
    } else if (this.currentMenu === 'main') {
      // If on 1st level, go back to account page
      navigate('/account');
    }
  };

  // Add new instructor
  addInstructor = async (instructorData) => {
    try {
      // TODO: Implement API call
      console.log('Adding instructor:', instructorData);
    } catch (error) {
      console.error('Error adding instructor:', error);
      throw error;
    }
  };

  // Edit instructor
  editInstructor = async (instructorId, instructorData) => {
    try {
      // TODO: Implement API call
      console.log('Editing instructor:', instructorId, instructorData);
    } catch (error) {
      console.error('Error editing instructor:', error);
      throw error;
    }
  };

  // Add new series
  addSeries = async (seriesData) => {
    try {
      // TODO: Implement API call
      console.log('Adding series:', seriesData);
    } catch (error) {
      console.error('Error adding series:', error);
      throw error;
    }
  };

  // Edit series
  editSeries = async (seriesId, seriesData) => {
    try {
      // TODO: Implement API call
      console.log('Editing series:', seriesId, seriesData);
    } catch (error) {
      console.error('Error editing series:', error);
      throw error;
    }
  };

  // Add course to series
  addCourseToSeries = async (seriesId, courseId) => {
    try {
      // TODO: Implement API call
      console.log('Adding course to series:', seriesId, courseId);
    } catch (error) {
      console.error('Error adding course to series:', error);
      throw error;
    }
  };

  // Add assistant
  addAssistant = async (assistantData) => {
    try {
      // TODO: Implement API call
      console.log('Adding assistant:', assistantData);
    } catch (error) {
      console.error('Error adding assistant:', error);
      throw error;
    }
  };

  // Edit assistant
  editAssistant = async (assistantId, assistantData) => {
    try {
      // TODO: Implement API call
      console.log('Editing assistant:', assistantId, assistantData);
    } catch (error) {
      console.error('Error editing assistant:', error);
      throw error;
    }
  };
}

const adminStore = new AdminStore();
export default adminStore;