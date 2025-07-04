import { makeAutoObservable, runInAction } from 'mobx';

class LanguageStore {
  currentLanguage = 'zh';
  translations = {};
  loadingPromises = {};

  constructor() {
    makeAutoObservable(this);
    this.loadSavedLanguage();
    // Load default language immediately
    this.loadTranslation(this.currentLanguage);
  }

  async loadTranslation(lang) {
    if (this.translations[lang] || this.loadingPromises[lang]) {
      return this.loadingPromises[lang] || Promise.resolve();
    }

    this.loadingPromises[lang] = (async () => {
      try {
        const module = await import(`../locales/${lang}.json`);
        runInAction(() => {
          this.translations[lang] = module.default;
        });
      } catch (error) {
        console.error(`Failed to load translation for ${lang}:`, error);
      }
    })();

    return this.loadingPromises[lang];
  }

  get t() {
    return (key, params = {}) => {
      try {
        const currentTranslations = this.translations[this.currentLanguage];
        if (!currentTranslations) {
          // Translation not loaded yet, return key as fallback
          return key;
        }

        const keys = key.split('.');
        let result = currentTranslations;
        
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

  setLanguage = async (lang) => {
    if (['en', 'zh', 'ja'].includes(lang)) {
      await this.loadTranslation(lang);
      runInAction(() => {
        this.currentLanguage = lang;
      });
      localStorage.setItem('language', lang);
    }
  };

  loadSavedLanguage = () => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['en', 'zh', 'ja'].includes(savedLang)) {
      this.currentLanguage = savedLang;
      this.loadTranslation(savedLang);
    }
  };
}

const languageStore = new LanguageStore();

export const t = languageStore.t;
export default languageStore;