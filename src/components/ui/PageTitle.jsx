import { observer } from 'mobx-react-lite';

const PageTitle = observer(({ 
  title, 
  className = "text-2xl font-bold mb-4" 
}) => {
  if (!title) return null;
  
  return (
    <h1 className={className}>
      {title}
    </h1>
  );
});

export default PageTitle;