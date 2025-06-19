// --- Elementos do DOM ---
const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');

const quizSetupForm = document.getElementById('quiz-setup-form');
const alunoNomeInput = document.getElementById('aluno-nome');
const disciplinaSelect = document.getElementById('disciplina');
const quantidadeQuestoesInput = document.getElementById('quantidade-questoes');

const currentQuestionNumberElement = document.getElementById('current-question-number');
const questionEnunciadoElement = document.getElementById('question-enunciado');
const alternativesContainer = document.getElementById('alternatives-container');
const nextQuestionBtn = document.getElementById('next-question-btn');

const resultTitleElement = document.getElementById('result-title');
const resultMessageElement = document.getElementById('result-message');
const resultScoreElement = document.getElementById('result-score');
const restartQuizBtn = document.getElementById('restart-quiz-btn');

// --- Variáveis do Quiz ---
let allQuestionsData = null; // Armazenará os dados do JSON
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let alunoNome = '';
let selectedDiscipline = '';
let numberOfQuestions = 0;
let selectedAlternative = null; // Armazena a alternativa selecionada pelo usuário

// --- Funções Auxiliares ---

// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função para carregar as questões do JSON
async function loadQuestions() {
    try {
        const response = await fetch('dados.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestionsData = await response.json();
        console.log('Questões carregadas:', allQuestionsData);
    } catch (error) {
        console.error("Erro ao carregar as questões:", error);
        alert("Erro ao carregar as questões. Verifique se o arquivo 'dados.json' está na pasta correta e sem erros.");
        return null;
    }
}

// --- Funções de Navegação e Lógica do Quiz ---

function startQuiz(event) {
    event.preventDefault();

    alunoNome = alunoNomeInput.value.trim();
    selectedDiscipline = disciplinaSelect.value;
    numberOfQuestions = parseInt(quantidadeQuestoesInput.value, 10);

    if (!alunoNome || !selectedDiscipline || isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }

    if (!allQuestionsData) {
        alert("As questões ainda não foram carregadas. Tente novamente em instantes ou recarregue a página.");
        return;
    }

    // Filtrar questões pela disciplina
    const disciplineQuestions = allQuestionsData.disciplinas.find(
        d => d.nome === selectedDiscipline
    );

    if (!disciplineQuestions) {
        alert("Disciplina não encontrada no banco de questões.");
        return;
    }

    // Embaralhar todas as questões da disciplina e pegar o quantitativo desejado
    const shuffledAllQuestions = shuffleArray([...disciplineQuestions.questoes]);
    currentQuizQuestions = shuffledAllQuestions.slice(0, numberOfQuestions);

    if (currentQuizQuestions.length === 0) {
        alert("Não foi possível gerar questões para a disciplina e quantidade selecionada. Tente com menos questões.");
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    selectedAlternative = null;

    setupSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestionIndex >= currentQuizQuestions.length) {
        showResult();
        return;
    }

    const question = currentQuizQuestions[currentQuestionIndex];
    currentQuestionNumberElement.textContent = `Questão ${currentQuestionIndex + 1} de ${numberOfQuestions}`;
    questionEnunciadoElement.textContent = question.enunciado;
    alternativesContainer.innerHTML = ''; // Limpa alternativas anteriores
    nextQuestionBtn.disabled = true; // Desabilita o botão até uma alternativa ser selecionada

    // REMOVEMOS O EMBARALHAMENTO DAS CHAVES.
    // AGORA, IREMOS ITERAR SOBRE AS CHAVES FIXAS 'A', 'B', 'C', 'D', 'E'
    // As chaves são sempre 'A', 'B', 'C', 'D', 'E' para garantir a ordem de exibição.
    const orderedKeys = ['A', 'B', 'C', 'D', 'E'];

    orderedKeys.forEach(key => { // Iteramos sobre as chaves em ordem fixa
        const alternativeText = question.alternativas[key]; // Pegamos o texto da alternativa correspondente à chave
        const label = document.createElement('label');
        label.className = 'alternative-item';
        label.innerHTML = `
            <input type="radio" name="alternative" value="${key}">
            <span>${key}) ${alternativeText}</span>
        `;
        label.addEventListener('click', () => selectAlternative(label, key));
        alternativesContainer.appendChild(label);
    });

    selectedAlternative = null; // Reseta a seleção para a nova questão
}
function selectAlternative(labelElement, key) {
    // Remove a classe 'selected' de todas as outras alternativas
    document.querySelectorAll('.alternative-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Adiciona a classe 'selected' à alternativa clicada
    labelElement.classList.add('selected');
    selectedAlternative = key;
    nextQuestionBtn.disabled = false; // Habilita o botão "Próxima Questão"
}

function checkAnswerAndNext() {
    if (selectedAlternative === null) {
        alert("Por favor, selecione uma alternativa antes de continuar.");
        return;
    }

    const question = currentQuizQuestions[currentQuestionIndex];
    const correctAlternative = question.gabarito;

    question.alunoResposta = selectedAlternative;

    // Visual feedback for correct/incorrect
    document.querySelectorAll('.alternative-item').forEach(item => {
        const radioInput = item.querySelector('input[type="radio"]');
        if (radioInput.value === correctAlternative) {
            item.classList.add('correct');
        } else if (radioInput.checked) {
            item.classList.add('incorrect');
        }
        radioInput.disabled = true; // Desabilita radios após responder
    });

    // Atualiza o score
    if (selectedAlternative === correctAlternative) {
        score++;
    }

    // Espera um pouco para o usuário ver o feedback antes de ir para a próxima
    setTimeout(() => {
        currentQuestionIndex++;
        displayQuestion();
    }, 1000); // 1 segundo de atraso
}

function showResult() {
    quizSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    const percentage = (score / numberOfQuestions) * 100;
    const finalScoreText = `Você acertou ${score} de ${numberOfQuestions} questões (${percentage.toFixed(2)}%).`;
    let message = '';
    let titleClass = '';

    // Referências aos elementos do GIF
    const gifContainer = document.getElementById('gifContainer');
    const resultGif = document.getElementById('resultGif');

    // Lógica para definir a mensagem, classe e o GIF apropriado
    if (percentage >= 70) {
        resultTitleElement.textContent = `Parabéns, ${alunoNome}!`;
        message = "Sua performance foi excelente! Continue assim!";
        titleClass = 'success';
        resultGif.src = 'pikashu coração.gif'; // <--- ATUALIZE ESTE CAMINHO
    } else {
        resultTitleElement.textContent = `Que pena, ${alunoNome}.`;
        message = "Você pode melhorar! Estude mais e tente novamente!";
        titleClass = 'fail';
        resultGif.src = 'pikachu triste.gif'; // <--- ATUALIZE ESTE CAMINHO
    }

    resultTitleElement.className = '';
    resultTitleElement.classList.add(titleClass);
    resultMessageElement.textContent = message;
    resultScoreElement.textContent = finalScoreText;

    // Exibir o GIF
    gifContainer.classList.remove('hidden');

    // Ocultar o GIF após 5 segundos
    setTimeout(() => {
        gifContainer.classList.add('hidden');
    }, 5000); // 5000 milissegundos = 5 segundos

    // --- ENVIAR SUBMISSÃO PARA O SERVIDOR ---
    const quizResult = {
        alunoNome: alunoNome,
        disciplina: selectedDiscipline,
        quantidadeQuestoes: numberOfQuestions,
        pontuacao: score,
        porcentagemAcertos: percentage.toFixed(2),
        questoesRespondidas: currentQuizQuestions.map((q, index) => {
            const alunoResposta = q.alunoResposta;
            const correta = q.gabarito === alunoResposta;
            return {
                id_questao: q.id,
                assunto: q.assunto,
                enunciado: q.enunciado,
                alternativa_aluno: alunoResposta,
                alternativa_correta: q.gabarito,
                esta_correta: correta
            };
        })
    };

    sendQuizSubmission(quizResult);
}

function restartQuiz() {
    resultSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    // Limpa campos do formulário para nova tentativa
    alunoNomeInput.value = '';
    disciplinaSelect.value = '';
    quantidadeQuestoesInput.value = '10'; // Reseta para o valor padrão
}

// --- Event Listeners ---
quizSetupForm.addEventListener('submit', startQuiz);
nextQuestionBtn.addEventListener('click', checkAnswerAndNext);
restartQuizBtn.addEventListener('click', restartQuiz);

// Carregar as questões assim que a página for carregada
document.addEventListener('DOMContentLoaded', loadQuestions);
