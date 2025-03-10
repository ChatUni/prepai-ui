import { observer } from 'mobx-react-lite';
import logoImage from '../../assets/logo.PNG';

const Logo = observer(() => {
  return (
    <div className="flex items-center justify-center">
      <img src={logoImage} alt="Logo" className="h-10 sm:h-12 md:h-16 object-contain" />
    </div>
  );
});

export default Logo;
