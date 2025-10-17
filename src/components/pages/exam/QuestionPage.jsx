import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import questionStore from '../../../stores/questionStore';
import { t } from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';
import examStore from '../../../stores/examStore';

const QuestionPage = observer(() => {
  const { id } = useParams();

  useEffect(() => {
    questionStore.setQuestions(examStore.getExamQuestions(id));
    return () => questionStore.resetExam();
  }, [id]);
  
  const handleOptionClick = (questionId, option) => {
    questionStore.selectAnswer(questionId, option);
  };

  const questionsList = (
    questionStore.questions.map((question, index) => (
      <div key={index} className="bg-white">
        <h3 className="text-lg font-medium mb-4">
          {index + 1}. {question.question} {questionStore.isMulti(question) ? `(多选)` : ''}
        </h3>
        <div className="space-y-2">
          {question.options.map((option, optIndex) => {
            const isCorrect = questionStore.isSubmitted && questionStore.isCorrectAnswer(question.id, option);
            const selectedAnswer = questionStore.getSelectedAnswer(question.id);
            const isSelected = questionStore.isMulti(question)
              ? Array.isArray(selectedAnswer) && selectedAnswer.includes(option)
              : selectedAnswer === option;
            const isWrongSelection = questionStore.isSubmitted && isSelected && !isCorrect;

            return (
              <div
                key={optIndex}
                className={questionStore.getOptionClass(question.id, option)}
                onClick={() => !questionStore.isSubmitted && handleOptionClick(question.id, option)}
              >
                <div className="flex items-center">
                  <span className="mr-3 font-medium text-gray-700 min-w-[20px]">
                    {String.fromCharCode(65 + optIndex)}.
                  </span>
                  {questionStore.isSubmitted && (
                    <span className="mr-2">
                      {isCorrect && <span className="text-green-700 font-bold">✓</span>}
                      {isWrongSelection && <span className="text-red-600 font-bold">✗</span>}
                    </span>
                  )}
                  <span>{option}</span>
                </div>
              </div>
            );
          })}
        </div>
        {questionStore.isSubmitted && (
          <div className="mt-3 text-sm flex">
            <div className="flex items-center mb-1">
              {(() => {
                const result = questionStore.isQuestionAnsweredCorrectly(question);
                if (result === null) {
                  return <span className="text-yellow-700 font-bold mr-2">未作答</span>;
                } else if (result === true) {
                  return <span className="text-green-700 font-bold mr-2">✓</span>;
                } else {
                  return <span className="text-red-600 font-bold mr-2">✗</span>;
                }
              })()}
            </div>
            <div className="text-gray-600">
              <span className="font-bold">正确答案: </span>{questionStore.getCorrectAnswersText(question)}
            </div>
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="container mx-auto px-4 py-4 pb-20 md:pb-8 h-full flex flex-col">
      <div className="flex justify-end items-center mb-4">
        {!questionStore.isSubmitted && (
          <button
            onClick={() => questionStore.submitExam()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('exam.submit')}
          </button>
        )}
      </div>
      {/* Questions List */}
      <div className="space-y-8 flex-1 overflow-y-auto pb-24">
        <LoadingState
          isLoading={questionStore.isLoading}
          isEmpty={!questionStore.isLoading && questionStore.questions.length === 0}
          customMessage={
            questionStore.isLoading ? t('common.loading') :
            questionStore.questions.length === 0 ? t('exam.noQuestions') :
            null
          }
        >
          {questionsList}
        </LoadingState>
      </div>
      
      {/* Results Dialog */}
      {questionStore.showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium mb-4">{t('exam.results')}</h3>
            <div className="space-y-2 mb-6">
              <p className="text-green-600">{t('exam.correctAnswers')}: {questionStore.examResults.correct}</p>
              <p className="text-red-600">{t('exam.incorrectAnswers')}: {questionStore.examResults.incorrect}</p>
              <p className="text-gray-600">
                {t('exam.unanswered')}: {questionStore.questions.length - (questionStore.examResults.correct + questionStore.examResults.incorrect)}
              </p>
            </div>
            <button
              onClick={() => questionStore.closeResults()}
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