import { makeAutoObservable, runInAction } from 'mobx';
import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';

class LanguageStore {
  currentLanguage = 'en';
  translations = {
    en,
    zh,
    ja
  };

  constructor() {
    makeAutoObservable(this);
    this.loadSavedLanguage();
  }

  get t() {
    return (key, params = {}) => {
      try {
        const keys = key.split('.');
        let result = this.translations[this.currentLanguage];
        
        // Navigate through nested objects
        for (const k of keys) {
          if (result && typeof result === 'object' && k in result) {
            result = result[k];
          } else {
            console.warn(`Translation missing for key: ${key}`);
            return key;
          }
        }
        
        // Handle parameter interpolation
        if (typeof result === 'string' && params) {
          return result.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? String(params[paramKey]) : match;
          });
        }
        
        // Ensure we always return a string
        return String(result || key);
      } catch (error) {
        console.error(`Error processing translation for key: ${key}`, error);
        return key;
      }
    };
  }

  setLanguage = (lang) => {
    if (['en', 'zh', 'ja'].includes(lang)) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
    }
  };

  loadSavedLanguage = () => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['en', 'zh', 'ja'].includes(savedLang)) {
      runInAction(() => {
        this.currentLanguage = savedLang;
      });
    }
  };
}

const languageStore = new LanguageStore();

export const t = languageStore.t;
export default languageStore;