import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examStore from '../stores/examStore';

const QuestionPage = observer(() => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };
  
  useEffect(() => {
    examStore.fetchQuestions(courseId);
    
    // Cleanup when component unmounts
    return () => {
      examStore.resetExam();
    };
  }, [courseId]);
  
  const handleOptionClick = (questionId, option) => {
    examStore.selectAnswer(questionId, option);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handleBack} className="text-blue-500 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          返回
        </button>
        {!examStore.isSubmitted && (
          <button
            onClick={() => examStore.submitExam()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            提交
          </button>
        )}
      </div>
      {/* Questions List */}
      <div className="space-y-8 flex-1 overflow-y-auto pb-24">
        {examStore.questionsWithParsedOptions.map((question, index) => {
          return (
            <div key={question.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">
                {index + 1}. {question.question}
              </h3>
              <div className="space-y-2">
                {question.parsedOptions.map((option, optIndex) => {
                  return (
                    <div
                      key={optIndex}
                      className={examStore.getOptionClass(question.id, option)}
                      onClick={() => !examStore.isSubmitted && handleOptionClick(question.id, option)}
                    >
                      {option}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Results Dialog */}
      {examStore.showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-medium mb-4">考试结果</h3>
            <div className="space-y-2 mb-6">
              <p className="text-green-600">正确答案: {examStore.examResults.correct}</p>
              <p className="text-red-600">错误答案: {examStore.examResults.incorrect}</p>
              <p className="text-gray-600">
                未作答: {examStore.questions.length - (examStore.examResults.correct + examStore.examResults.incorrect)}
              </p>
            </div>
            <button
              onClick={() => examStore.closeResults()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestionPage;