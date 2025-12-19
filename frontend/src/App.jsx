import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './App.css';

const API_URL = 'https://127.0.0.1:8000'; 

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login-cookie?username=${username}&password=${password}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        onLogin(username);
        navigate('/');
      } else {
        alert("Ошибка входа");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>
      <div className="result-badge">🦉</div>
      <h1>Вход QuizLingo</h1>
      <div className="card">
        <input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn btn-primary" onClick={handleLogin}>ВОЙТИ</button>
      </div>
    </div>
  );
}

function QuizList() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/quizzes`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => setQuizzes(data))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="container">
      <h2>Все квизы</h2>
      {quizzes.map(q => (
        <div key={q.id} className="card">
          <h3>{q.title}</h3>
          <p style={{color: '#999'}}>Автор: {q.author}</p>
          <Link to={`/quiz/${q.id}`}>
            <button className="btn btn-secondary">ПРОЙТИ</button>
          </Link>
        </div>
      ))}
    </div>
  );
}

function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [res1, setRes1] = useState('');
  const [res2, setRes2] = useState('');
  const [res3, setRes3] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([...questions, { text: '', opt1: '', opt2: '', opt3: '' }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const handleSubmit = async () => {
    const potentialResults = [
      { name: res1, key: 'opt1' },
      { name: res2, key: 'opt2' },
      { name: res3, key: 'opt3' }
    ];

    const activeResults = potentialResults.filter(r => r.name.trim() !== '');

    if (!title) {
      alert("Введите название квиза");
      return;
    }
    if (activeResults.length < 2) {
      alert("Заполните хотя бы 2 варианта результатов, чтобы был смысл выбирать!");
      return;
    }
    if (questions.length === 0) {
      alert("Добавьте хотя бы один вопрос");
      return;
    }

    const formattedQuestions = questions.map(q => ({
      text: q.text,
      options: activeResults.map((res, index) => ({
        text: q[res.key],
        result_index: index
      }))
    }));

    const payload = {
      title: title,
      result_names: activeResults.map(r => r.name),
      questions: formattedQuestions
    };
    
    await fetch(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    navigate('/');
  };

  const getInputStyle = (color, shadowColor, isActive) => ({
    borderColor: isActive ? color : '#e5e5e5',
    borderWidth: '2px',
    boxShadow: isActive ? `0 4px 0 ${shadowColor}` : 'none',
    background: isActive ? 'white' : '#f9f9f9',
    transition: 'all 0.2s'
  });

  return (
    <div className="container">
      <h2>Конструктор квиза</h2>
      <div className="card">
        <label style={{marginBottom: '15x'}}>Название</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Какой ты кухонный прибор?" style={{marginBottom: '15px'}}/>
        
        <h3 style={{marginBottom: '10px'}}>Варианты результатов (Минимум 2)</h3>
        
        <input 
          value={res1} 
          onChange={e => setRes1(e.target.value)} 
          placeholder="Ложка" 
          style={getInputStyle('#ff4b4b', '#d43535', res1)}
        />
        
        <input 
          value={res2} 
          onChange={e => setRes2(e.target.value)} 
          placeholder="Вилка" 
          style={getInputStyle('#1cb0f6', '#1899d6', res2)}
        />
        
        <input 
          value={res3} 
          onChange={e => setRes3(e.target.value)} 
          placeholder="Нож" 
          style={getInputStyle('#58cc02', '#46a302', res3)}
        />

        <hr style={{margin: '20px 0', border: 'none', borderTop: '2px solid #e5e5e5'}}/>

        {questions.map((q, i) => (
          <div key={i} style={{marginBottom: '30px', background: '#fff', border: '2px solid #e5e5e5', padding: '15px', borderRadius: '16px'}}>
            <strong>Вопрос {i + 1}</strong>
            <input 
              value={q.text} 
              onChange={e => updateQuestion(i, 'text', e.target.value)} 
              placeholder="Текст вопроса" 
              style={{marginBottom: '15px', marginTop: '5px'}}
            />
            
            <div style={{fontSize: '12px', marginTop: '5px', color: res1 ? '#000' : '#ccc'}}>
              Ответ для {res1 ? `"${res1}"` : 'результата A'}:
            </div>
            <input 
              value={q.opt1} 
              onChange={e => updateQuestion(i, 'opt1', e.target.value)} 
              style={getInputStyle('#ff4b4b', '#d43535', res1)}
              disabled={!res1}
            />
            
            <div style={{fontSize: '12px', marginTop: '5px', color: res2 ? '#000' : '#ccc'}}>
              Ответ для {res2 ? `"${res2}"` : 'результата B'}:
            </div>
            <input 
              value={q.opt2} 
              onChange={e => updateQuestion(i, 'opt2', e.target.value)} 
              style={getInputStyle('#1cb0f6', '#1899d6', res2)}
              disabled={!res2}
            />
            
            <div style={{fontSize: '12px', marginTop: '5px', color: res3 ? '#000' : '#ccc'}}>
              Ответ для {res3 ? `"${res3}"` : 'результата C'}:
            </div>
            <input 
              value={q.opt3} 
              onChange={e => updateQuestion(i, 'opt3', e.target.value)} 
              style={getInputStyle('#58cc02', '#46a302', res3)}
              disabled={!res3}
            />
          </div>
        ))}

        <button className="btn btn-outline" onClick={addQuestion}>+ ДОБАВИТЬ ВОПРОС</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{marginTop: '20px'}}>СОХРАНИТЬ КВИЗ</button>
      </div>
    </div>
  );
}

function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState([0, 0, 0]);

  useEffect(() => {
    fetch(`${API_URL}/quizzes/${id}`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        const mappedQ = data.questions.map(q => ({
          ...q,
          options: q.options.sort(() => Math.random() - 0.5) 
        }));
        setQuiz({...data, questions: mappedQ});
      });
  }, [id]);

  if (!quiz) return <div className="container">Загрузка...</div>;

  const handleAnswer = (resultIndex) => {
    const newScores = [...scores];
    newScores[resultIndex] += 1;
    setScores(newScores);

    if (step < quiz.questions.length - 1) {
      setStep(step + 1);
    } else {
      finishQuiz(newScores);
    }
  };

  const finishQuiz = async (finalScores) => {
    const maxScore = Math.max(...finalScores);
    const winnerIndex = finalScores.indexOf(maxScore);
    const resultText = quiz.result_names[winnerIndex];
    const date = new Date().toLocaleDateString();

    await fetch(`${API_URL}/results`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({
        quiz_title: quiz.title,
        result_text: resultText,
        date: date
      })
    });
    
    navigate('/results');
  };

  const currentQ = quiz.questions[step];

  return (
    <div className="container">
      <h3>{quiz.title}</h3>
      <div style={{height: '10px', background: '#e5e5e5', borderRadius: '5px', marginBottom: '20px'}}>
        <div style={{
          height: '100%', 
          width: `${((step + 1) / quiz.questions.length) * 100}%`, 
          background: '#58cc02',
          borderRadius: '5px',
          transition: 'width 0.3s'
        }}></div>
      </div>

      <div className="card">
        <h2>{currentQ.text}</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          {currentQ.options.map((opt, idx) => (
            <button key={idx} className="option-btn" onClick={() => handleAnswer(opt.result_index)}>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Results() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/my-results`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => setHistory(data));
  }, []);

  return (
    <div className="container">
      <h2 style={{textAlign: 'center'}}>Ваши результаты</h2>
      <div className="result-badge">🏆</div>
      {history.length === 0 && <p style={{textAlign: 'center'}}>Вы пока не прошли ни одного квиза.</p>}
      {history.map((h, idx) => (
        <div key={idx} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <strong>{h.quiz_title}</strong>
            <div style={{color: '#58cc02', fontWeight: 'bold', fontSize: '18px'}}>{h.result_text}</div>
          </div>
          <div style={{color: '#999', fontSize: '14px'}}>{h.date}</div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      {user && (
        <nav className="container">
          <div>
            <Link to="/">ГЛАВНАЯ</Link>
            <Link to="/create">СОЗДАТЬ</Link>
            <Link to="/results">ПРОФИЛЬ</Link>
          </div>
          <div style={{color: '#1cb0f6'}}>@{user}</div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        
        <Route path="/" element={user ? <QuizList /> : <Login onLogin={setUser} />} />
        <Route path="/create" element={user ? <CreateQuiz /> : <Login onLogin={setUser} />} />
        <Route path="/quiz/:id" element={user ? <TakeQuiz /> : <Login onLogin={setUser} />} />
        <Route path="/results" element={user ? <Results /> : <Login onLogin={setUser} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;