import { observer } from 'mobx-react-lite';

const Logo = observer(() => {
  return (
    <div className="bg-blue-600 text-white text-2xl font-bold rounded-lg p-4 w-32 h-16 flex items-center justify-center">
      Logo
    </div>
  );
});

export default Logo;
