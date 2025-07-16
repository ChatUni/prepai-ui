import { observer } from 'mobx-react-lite';
import logoImage from '../../assets/logo.png';
import clientStore from '../../stores/clientStore';

const Logo = observer(() => {
  return (
    <div className="flex items-center justify-center">
      <img src={clientStore.client.logo || logoImage} alt="Logo" className="h-10 sm:h-12 md:h-16 object-contain" />
    </div>
  );
});

export default Logo;
