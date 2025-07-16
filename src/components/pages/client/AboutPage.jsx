import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import clientStore from '../../../stores/clientStore';
import { t } from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';
import logoImage from '../../../assets/logo.png';

const AboutPage = observer(() => {
  useEffect(() => {
    clientStore.loadClient();
  }, []);

  if (clientStore.isLoading) {
    return <LoadingState />;
  }

  const { client } = clientStore;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('about.title')}
          </h1>
          {/* <p className="text-blue-100">
            {t('about.subtitle')}
          </p> */}
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
              <img 
                src={client.logo || logoImage} 
                alt={client.name || t('about.logoAlt')}
                className="h-24 w-24 object-contain"
              />
            </div>
          </div>

          {/* Client Name */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {client.name || t('about.defaultName')}
            </h2>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-6">
            {/* <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {t('about.description')}
            </h3> */}
            <div className="text-gray-600 leading-relaxed">
              {client.desc ? (
                <p className="whitespace-pre-wrap">{client.desc}</p>
              ) : (
                <p className="italic text-gray-500">
                  {t('about.noDescription')}
                </p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                {t('about.contact')}
              </h4>
              <p className="text-blue-600 text-sm pb-4">
                {t('about.contactInfo')}
              </p>
              <div className="space-y-3">
                {client.phone && (
                  <div className="flex items-center text-blue-700">
                    <span className="font-medium mr-2">{t('client.phone')}:</span>
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-blue-700">
                    <span className="font-medium mr-2">{t('client.email')}:</span>
                    <span>{client.email}</span>
                  </div>
                )}
                {!client.phone && !client.email && (
                  <p className="text-blue-600 text-sm">
                    {t('about.contactInfo')}
                  </p>
                )}
              </div>
            </div>
            
            {/* <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                {t('about.services')}
              </h4>
              <p className="text-green-600 text-sm">
                {t('about.servicesInfo')}
              </p>
            </div> */}
          </div>

          {/* QR Code */}
          {client.qrcode && (
            <div className="mt-6 text-center">
              <h4 className="font-semibold text-gray-800 mb-4">
                {t('client.qrcode')}
              </h4>
              <div className="inline-block p-4 bg-gray-50 rounded-lg">
                <img
                  src={client.qrcode}
                  alt={t('client.qrcode')}
                  className="h-48 w-48 object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AboutPage;