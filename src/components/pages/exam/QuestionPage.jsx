import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examStore from '../../../stores/examStore';
import { tap } from '../../../../netlify/functions/utils/util';
import languageStore from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';

const QuestionPage = observer(() => {
  const { t } = languageStore;
  const { courseId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await examStore.fetchQuestions(courseId);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    
    fetchData();
    
    // Cleanup when component unmounts
    return () => {
      examStore.resetExam();
    };
  }, [courseId, navigate]);
  
  const handleOptionClick = (questionId, option) => {
    examStore.selectAnswer(questionId, option);
  };

  const questionsList = (
    examStore.questionsWithParsedOptions.map((question, index) => (
      <div key={question.id} className="bg-white">
        <h3 className="text-lg font-medium mb-4">
          {index + 1}. {question.question}
        </h3>
        <div className="space-y-2">
          {question.parsedOptions.map((option, optIndex) => (
            <div
              key={optIndex}
              className={examStore.getOptionClass(question.id, option)}
              onClick={() => !examStore.isSubmitted && handleOptionClick(question.id, option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    ))
  );

  return (
    <div className="container mx-auto px-4 py-4 pb-20 md:pb-8 h-full flex flex-col">
      <div className="flex justify-end items-center mb-4">
        {!examStore.isSubmitted && (
          <button
            onClick={() => examStore.submitExam()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('exam.submit')}
          </button>
        )}
      </div>
      {/* Questions List */}
      <div className="space-y-8 flex-1 overflow-y-auto pb-24">
        <LoadingState
          isLoading={examStore.isLoading}
          isEmpty={!examStore.isLoading && examStore.questionsWithParsedOptions.length === 0}
          customMessage={
            examStore.isLoading ? t('common.loading') :
            examStore.questionsWithParsedOptions.length === 0 ? t('exam.noQuestions') :
            null
          }
        >
          {questionsList}
        </LoadingState>
      </div>
      
      {/* Results Dialog */}
      {examStore.showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium mb-4">{t('exam.results')}</h3>
            <div className="space-y-2 mb-6">
              <p className="text-green-600">{t('exam.correctAnswers')}: {examStore.examResults.correct}</p>
              <p className="text-red-600">{t('exam.incorrectAnswers')}: {examStore.examResults.incorrect}</p>
              <p className="text-gray-600">
                {t('exam.unanswered')}: {examStore.questions.length - (examStore.examResults.correct + examStore.examResults.incorrect)}
              </p>
            </div>
            <button
              onClick={() => examStore.closeResults()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              {t('exam.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestionPage;