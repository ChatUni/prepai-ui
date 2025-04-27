import { useNavigate } from 'react-router-dom';

const BackButton = ({ onClick, label = '', className = '' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button onClick={handleClick} className={`text-blue-500 flex items-center ${className}`}>
      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
      {label}
    </button>
  );
};

export default BackButton;