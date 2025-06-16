import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ReactModal from 'react-modal';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios'; // Certifique-se de importar o Axios

ReactModal.setAppElement('#root'); 
// Recupera o token do localStorage, se dispon�vel
const token = localStorage.getItem('token');
if (token) {
    // Configura o cabeçalho padrão de Authorization com o token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
