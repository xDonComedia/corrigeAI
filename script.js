const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");
const chatbotToggler = document.querySelector(".chatbot-toggler");


let userMessage;

const createChatLi = (message, className) => {
  // cria um chay <li> com a mensagem e classe imposta
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  let chatContent = className === "direita" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const handleSendChat = async () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;
  
  // adc a mensagem do user no chatbox
  chatbox.appendChild(createChatLi(userMessage, "direita"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  // mensagem de "processando" -> depois da resposta, some
  const processingLi = createChatLi("Processando...", "esquerda");
  chatbox.appendChild(processingLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

   // 1. analise semantica e sintatica (basic checks)
  const hasConnectives = /((e|mas|porque|pois|portanto|então|embora|se|quando)).+/i.test(userMessage);
  const hasMinCharacters = userMessage.length > 100;

  const hasAcademicVocabulary = /((análise|argumento|contexto|desenvolvimento|evidência|fato|hipótese|ideia|impacto|interpretação|perspectiva|problema|prova|relação|significado|tese|teoria)).+/i.test(userMessage);
  const hasAcademicTopics = /((história|filosofia|política|economia|ciência|tecnologia)).+/i.test(userMessage);
  const hasCohesiveIdeas = /\b[A-Za-z]+\s*\b[A-Za-z]+\s*\b[A-Za-z]+\b/i.test(userMessage); // expressão regular fixa

   // 2. tentativa identificar Essay 
  const isEssayLikely = hasConnectives && hasMinCharacters && hasAcademicVocabulary &&
                        hasAcademicTopics && hasCohesiveIdeas;
  if (isEssayLikely) {
    try {
    // **Import and Initialize GoogleGenerativeAI (outside handleChat for efficiency):**
    const { GoogleGenerativeAI } = await import("@google/generative-ai"); // Async import for efficiency

    const API_KEY = "AIzaSyA-ZAF-i-FeSt4sUt9baVQfgFS64qB39S8"; // Replace with your Google Generative AI API key

    const genAI = new GoogleGenerativeAI(API_KEY);

    // **Get the generative model (consider caching for repeated interactions):**
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    // começa o chat com o historico
    const chat = model.startChat({
            history: [
              { role: "user", parts: [{ text: userMessage }] }, // mensagem do User
              { role: "model", parts: [{ text: "" }] }, //  model vazio response
            ],
            generationConfig: {
              maxOutputTokens: 10000,
            },
          });
          
    if (userMessage.toLowerCase().includes("resumo")) {
      // gera o response com o sumario do essay
      const result = await chat.sendMessage(userMessage + " resumir texto da redação");
      //processa o resonse e add pro chatbox
    } else if (userMessage.toLowerCase().includes("temas")) {
      // gera o response com o essay pra identificar tema
      const result = await chat.sendMessage(userMessage + " indentificar o tema da redação")
      //processa o reponse e add pro chatbox
    } else {
      // gera ana analise do response do essay incial
      const result = await chat.sendMessage(userMessage + "analisar texto da redação com uma nota de 0-1000, e descrevendo erros e acertos de cada uma das competencias do enem dando as notas de cada uma das competencias com notas 0-200 e ao final some a nota das 5 competencias.");
    }

    // Manda a msg e recebe o response
    const result = await chat.sendMessage(userMessage + "analisar texto da redação com uma nota de 0-1000, e descrevendo erros e acertos de cada uma das competencias do enem dando as notas de cada uma das competencias com notas 0-200 e ao final some a nota das 5 competencias."); // sem separação de 'msg' 
    const response = await result.response;
    const text = response.text();
    

    
    // **verifica erro na descrição**
    const hasErrorDescription = /erro\s+((Nota Total|Acertos|Erros)).+/i.test(result.text);

    const hasNotaTotalContent = /Nota\s+Total:\s+(\d+)/i.test(result.text);
    const hasAcertosContent = /Acertos:\s+((?:\d+\s*)+)/i.test(result.text);
    const hasErrosContent = /Erros:\s+((?:\d+\s*)+)/i.test(result.text);
    
    if (hasErrorDescription || !hasNotaTotalContent || !hasAcertosContent || !hasErrosContent) {
      // Process response and add to chatbox
      const text = response.text();
      chatbox.appendChild(createChatLi("", "esquerda"));
    } else {
      // Display error message if conditions not met
      chatbox.appendChild(createChatLi("A análise da redação não contém a descrição de erros ou acertos das competências. Por favor, tente novamente.", "esquerda"));
    }
    // remove a msg de processamento
    chatbox.removeChild(processingLi);

    // adc model response pro chatbox
    chatbox.appendChild(createChatLi(text, "esquerda"));
    
  } catch (error) {
    console.error("erro gerado,erro:", error);
    chatbox.removeChild(processingLi); // Remove mensagem de processamento no caso de erro
    chatbox.appendChild(createChatLi("Ocorreu um erro, por favor tente novamente", "esquerda"));
  }

  // Limpa o imput, para o proximo comando
  chatInput.value = "";
} else {
  chatbox.appendChild(createChatLi("Este texto não parece ser uma redação. Por Favor tente novamente enviando uma redação.", "esquerda"));
  chatbox.removeChild(processingLi); // Remove mensagem de processamento no caso de não ser uma redação
    chatInput.value = ""; // Clear input field for resend
}
};

const handleChatbotToggle = () => {
  document.body.classList.toggle("aparecer-chatbot");
};

sendChatBtn.addEventListener("click", handleSendChat);
chatbotToggler.addEventListener("click", handleChatbotToggle);

