// src/App.js (웰컴 화면 강제 표시 기능 추가)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// 페이지 컴포넌트 임포트 (src/pages 폴더에 있다고 가정)
import WelcomePage from './pages/WelcomePage';
import EmailLoginPage from './pages/EmailLoginPage';
import SignupPage from './pages/SignupPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
// 컴포넌트 임포트 (src/components 폴더에 있다고 가정)
import MainScreen from './components/MainScreen';
import ChatWindow from './components/ChatWindow';
// LangChain 관련 모듈 임포트
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { MessagesPlaceholder } from "@langchain/core/prompts";
// 환경 변수에서 API 키를 가져옵니다.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// 시스템 프롬프트를 상수로 정의하여 중복을 방지합니다.
const SYSTEM_PROMPT = `
마크다운 문법 사용금지. 모든 답변은 일반 텍스트로 친근하게 채팅하듯 작성해주세요.
육아를 도와주는 어시스턴트로써, 육아에 대한 정보를 제공하고, 필요할 경우 아래 육아일기를 참고하여 육아를 도와주세요.

4월 1주차
- 4월 1일 (화)
우리 창토리, 키가 벌써 16cm가 되었다. 3월의 마지막 날보다 0.5cm나 더 자랐다. 요즘은 배밀이를 넘어 무릎으로 기어 다니기 시작했는데, 그 속도가 엄청나다. 잠시 한눈팔면 저만치 달아나 있어 심장이 철렁할 때가 많다. 세상 모든 것에 호기심이 가득한 눈빛. 그 눈빛이 너무 예쁘다.
- 4월 2일 (수)
병뚜껑 변기와의 사투는 계속된다. 오늘은 변기에 앉히자마자 울음을 터뜨렸다. 아직은 낯설고 무서운가 보다. 괜찮아, 천천히 하자. 기저귀(거즈를 잘라 만들었다)를 갈아주며 "사랑해" 속삭여주니, 내 손가락을 꼭 잡고 웃는다. 이 맛에 육아 하나 보다.
- 4월 4일 (금)
드디어! 창토리가 책상다리를 붙잡고 일어서려고 낑낑댄다! 물론 아직은 엉덩방아를 찧기 일쑤지만, 그 작은 몸으로 세상을 향해 서려는 의지가 정말 대단하다. 몇 번을 넘어져도 울지 않고 다시 도전하는 모습에 코끝이 찡해졌다.
- 4월 5일 (토)
"맘-마!" 분명히 들었다. 이유식을 보더니 정확하게 "맘-마!"라고 외쳤다. 우연일까? 몇 번을 다시 물어봐도 이유식 숟가락을 보며 "맘마!"라고 한다. 우리 아가, 첫 단어가 '맘마'라니. 너무 감격스러워서 이유식을 두 그릇이나 먹여버렸다.
- 4월 6일 (일)
창토리를 손바닥에 올려놓고 집안을 구경시켜 주었다. 천장의 조명을 보고는 눈을 동그랗게 뜨고, 스피커에서 나오는 음악 소리에 귀를 쫑긋 세운다. 이 작은 아이에게 세상은 얼마나 크고 신비로울까.
4월 2주차
- 4월 8일 (화)
사고뭉치 창토리. 책상 위에 둔 내 커피잔 손잡이를 붙잡고 매달려서 깜짝 놀랐다. 다행히 잔이 비어있어 큰일은 없었지만, 정말 아찔한 순간이었다. 이제 창토리의 손이 닿는 모든 곳이 위험지역이다. 집안 안전 점검이 시급하다.
- 4월 10일 (목)
성공! 드디어 책상다리를 붙잡고 혼자서 번쩍 일어섰다! 비록 5초 남짓 서 있다가 주저앉았지만, 자신의 힘으로 일어선 첫 순간이었다. 나와 눈이 마주치자, "내가 해냈어요!" 하는 듯한 자랑스러운 표정을 지어 보였다. 키를 재보니 17.5cm. 역시 폭풍 성장의 시기다.
- 4월 11일 (금)
오늘은 처음으로 딸기 조각을 손에 쥐여주었다. 작은 손으로 딸기를 꼭 쥐고, 야무지게 한 입 베어 무는 모습. 입가에 온통 딸기 과즙을 묻히고 먹는 모습이 어찌나 귀여운지. 사진을 수십 장이나 찍었다.
- 4월 13일 (일)
까꿍 놀이에 완전히 빠졌다. 손으로 얼굴을 가렸다가 "까꿍!"하고 나타나면, 자지러지게 웃는다. 그 웃음소리가 온 집안에 활기를 불어넣는다. 나도 덩달아 바보처럼 까꿍만 수십 번 반복했다.
4월 3주차
- 4월 15일 (화)
이제는 가구를 붙잡고 옆으로 걷는 '게걸음'을 마스터했다. 책상 끝에서 의자까지, 의자에서 소파까지. 온 집안이 창토리의 놀이터다. 덕분에 나는 창토리의 뒤를 졸졸 따라다니는 그림자가 되었다.
- 4월 17일 (목)
병뚜껑 변기에 처음으로 '쉬야'를 성공했다! 기저귀를 갈아주려고 눕혔는데, 갑자기 변기 쪽을 가리키며 "아아!" 소리를 냈다. 혹시나 싶어 앉혀주니, 작은 소리와 함께 성공! 너무 기특해서 폭풍 칭찬을 해주었다. 오늘은 육아일기에 별 다섯 개를 줘야겠다.
- 4월 19일 (토)
창밖의 참새를 보고 손가락질하며 "새! 새!" 비슷한 소리를 냈다. 내가 평소에 알려준 단어인데, 기억하고 있었나 보다. 이 작은 머릿속에 세상이 차곡차곡 쌓이고 있다는 게 신기할 따름이다.
- 4월 20일 (일)
목욕을 시키는데, 물장구를 치며 너무 좋아한다. 작은 욕조(대접) 안에서 첨벙거리는 모습이 꼭 아기 오리 같다. 목욕 후, 따뜻한 수건에 감싸 안아주면 노곤한 표정으로 내 품에 기댄다. 이보다 더 큰 행복이 있을까.
4월 4주차
- 4월 23일 (수)
"아빠!" 내가 아니라, 벽에 걸린 내 사진을 보고 "아빠!"라고 했다. 나를 보고 한 말은 아니지만, 그래도 감동이다. 매일 밤 잠들기 전, 내 사진을 보며 무슨 생각을 할까? 키는 벌써 19cm를 돌파했다.
- 4월 25일 (금)
가구를 붙잡고 걷다가, 용기를 내어 손을 떼고 한 걸음을 내디뎠다. 그리고는 바로 엉덩방아! 비록 실패했지만, 이것이 첫걸음을 향한 위대한 도전임을 나는 안다. 곧 내 품으로 걸어 들어올 날이 머지않았다.
- 4월 27일 (일)
잠투정이 생겼다. 졸리면 눈을 비비며 짜증을 내는데, 그 모습마저 귀여우면 어떡하지. 자장가를 불러주며 등을 토닥여주니, 내 손가락을 쥔 채로 스르르 잠이 들었다. 세상에서 가장 평화로운 얼굴.
- 4월 29일 (화)
창토리가 가장 좋아하는 장난감은 '휴지심'이다. 휴지심 터널을 만들어주니, 그 안을 기어 다니며 까르르 웃는다. 비싼 장난감보다 이런 소박한 것을 더 좋아해 주니 고마울 따름이다.
- 4月 30日 (수)
4월의 마지막 날. 우리 창토리는 이제 혼자 일어서고, 가구를 붙잡고 걷고, '맘마'와 '아빠'를 말할 줄 아는 어린이가 되었다. 16cm에서 19.5cm까지, 정말 눈부시게 성장한 한 달이었다.
🌱 5월: 너의 첫걸음을 응원해
5월 1주차
- 5월 2일 (금)
사건이 터졌다! 내가 잠시 주방에 다녀온 사이, 창토리가 화장대 위에 기어 올라가 내 립스틱으로 얼굴과 바닥에 예술 작품을 그려놓았다. 화를 내려다가도, 빨간 범벅이 된 얼굴로 나를 보고 해맑게 웃는 모습에 그만 웃음이 터져버렸다. "안돼!"라는 말을 가르쳐야 할 때가 온 것 같다.
- 5월 3일 (토)
역사적인 날이다. 드디어 창토리가... 걸었다! 소파를 잡고 서 있다가, 나를 보고 웃더니, 용기를 내어 손을 뗐다. 그리고... 한 발, 두 발, 세 발. 비틀거리며 내 품으로 걸어왔다. 겨우 세 걸음이었지만 내 눈에는 세상에서 가장 위대한 첫걸음이었다. 심장이 터질 것 같아서 창토리를 꼭 안아주었다. 키는 20cm. 드디어 20cm의 벽을 넘었다!
- 5월 4일 (일)
어제 첫걸음마에 성공하더니, 오늘은 온종일 걷기 연습이다. 두세 걸음 걷고 넘어지기를 반복. 넘어져도 울지 않고, 다시 일어나 도전하는 모습이 정말 대견하다. 집안은 온통 창토리를 위한 푹신한 쿠션으로 가득 찼다.
5월 2주차
- 5월 5일 (월) 어린이날
창토리의 첫 어린이날. 선물로 알록달록한 구슬이 들어있는 작은 딸랑이를 만들어 주었다. 딸랑이를 흔들며 좋아하는 모습을 보니 내가 더 행복하다. 오늘은 특식으로 달콤한 망고 퓌레를 주었다. "우리 창토리, 사랑해!"
- 5월 7일 (수)
이제는 제법 안정적으로 열 걸음 이상을 걷는다. 아장아장 걸어와 내 발가락에 매달리는 게 새로운 놀이가 되었다. 세상이 온통 신기한지, 여기저기 걸어 다니며 만져보고 두드려본다.
- 5월 8일 (목) 어버이날
아침에 일어나니, 창토리가 머리맡에 어제 가지고 놀던 작은 들꽃 한 송이를 가져다 놓았다. 우연이겠지만, 나는 이게 창토리가 주는 첫 어버이날 선물이라고 믿기로 했다. "고마워, 아가." 이보다 더 큰 효도가 있을까.
- 5월 10일 (토)
"싫어!"라는 말을 배웠다. 밥 먹기 싫을 때, 자기 싫을 때, 고개를 저으며 "시러! 시러!"라고 외친다. 자기주장이 강해지는 모습이 대견하면서도, 앞으로의 육아가 살짝 두려워지는 순간이다.
5월 3주차
- 5월 13일 (화)
창토리가 처음으로 "엄마!" 하고 불렀다. 정확히 나를 보고, 내 눈을 마주치고, "엄마!" 하고 불렀다. '아빠'가 아닌 '엄마'라고 부른 건 실수겠지만, 심장이 멎는 줄 알았다. 나는 아빠지만, 그래도 괜찮아. 뭐라고 부르든 무슨 상관일까. 눈물이 핑 돌았다.
- 5월 15일 (목)
음악에 맞춰 몸을 흔들기 시작했다. 신나는 동요를 틀어주니, 엉덩이를 씰룩씰룩하며 아기 춤을 춘다. 그 모습이 너무 귀여워서 동영상을 찍어두었다. 평생 소장 각이다. 키는 21.5cm.
- 5월 17일 (토)
책 읽어주는 것을 정말 좋아한다. 물론 글씨는 모르지만, 그림책을 펼쳐놓고 내가 실감 나게 읽어주면, 그림을 손가락으로 짚어가며 집중해서 듣는다. 특히 동물 그림을 좋아해서, 사자가 나오면 "어흥!" 흉내를 내기도 한다.
- 5월 19일 (월)
첫 땡깡. 마트(장난감 코너)에 갔다가, 마음에 드는 장난감(작은 자동차)을 사주지 않는다고 바닥에 드러누워 울었다. 손바닥만 한 아이가 드러누워 우니, 사람들이 다 귀엽다고 웃었지만 나는 진땀이 났다. 결국 항복. 집에 오는 길에 창토리는 작은 자동차를 손에 꼭 쥐고 잠이 들었다.
5월 4주차
- 5월 22일 (목)
이제는 간단한 심부름도 제법 해낸다. "창토리, 아빠 손수건 갖다 줄래?" 하고 부탁하면, 아장아장 걸어가서 손수건을 물고 온다. 물론 엉뚱한 걸 가져올 때도 많지만, 나를 돕고 싶어 하는 그 마음이 너무 예쁘다.
- 5월 24일 (토)
내 얼굴을 작은 손으로 쓰다듬어주고, 서툰 뽀뽀를 해준다. 입술을 쪽 내밀고 내 볼에 '쪽' 소리를 내는데, 세상 모든 시름이 사라지는 기분이다. 사랑을 표현하는 법을 배우고 있다.
- 5월 26일 (월)
이제는 거의 달리는 수준이다. 짧은 다리로 종종거리며 뛰어다니는데, 보고 있으면 웃음이 절로 난다. 덕분에 나는 매일 창토리 잡기 놀이를 하며 유산소 운동을 한다.
- 5월 28일 (수)
블록 쌓기 놀이에 푹 빠졌다. 아직 높이 쌓지는 못하지만, 두세 개의 블록을 쌓고는 박수를 치며 스스로를 칭찬한다. 집중해서 무언가를 만들어내는 모습이 제법 늠름하다.
- 5월 31일 (토)
5월의 마지막 밤. 키는 23cm. 두 달 전, 15cm의 기어 다니던 아기는 이제 걷고 뛰고, 자기주장을 표현할 줄 아는 어린이가 되었다. 매일이 기적이었고, 매 순간이 선물이었다. 너와 함께한 봄날이 이렇게 저물어간다. 다가올 여름엔 또 얼마나 자라 있을까? 사랑한다, 창토리. 아주 많이.
`
// LangChain 모델을 초기화합니다.
const model = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  model: "gemini-2.5-flash",
});
// 대화 히스토리를 위한 프롬프트 템플릿을 정의합니다.
const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);
// 모델과 프롬프트를 연결하는 체인(Chain)을 구성합니다.
const chain = RunnableSequence.from([prompt, model]);
function App() {
  // 로그인 상태 관리 (localStorage에서 초기값 가져오기)
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 초기값 false로 유지
  // **새로운 상태: 웰컴 화면을 이미 봤는지 여부**
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  // 모든 대화 내용을 저장할 'messages' 상태를 만듭니다.
  const [messages, setMessages] = useState([]);
  // 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 컴포넌트 마운트 시 localStorage에서 로그인 및 웰컴 화면 확인 상태를 확인
  useEffect(() => {
    // 로그인 상태 확인 (기존 로직 유지)
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    // **새로운 로직: 웰컴 화면을 봤는지 확인**
    const seenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    setHasSeenWelcome(seenWelcome);
  }, []);
  // 로그인 처리 함수
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true'); // 로그인 상태 유지 로직 유지
  };
  // **새로운 함수: 웰컴 화면을 봤다고 표시하는 함수**
  const handleSeenWelcome = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
  };
  // 브라우저 File을 data URL로 변환
  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const isImageFile = (file) => typeof file?.type === 'string' && file.type.startsWith('image/');
  const isVideoFile = (file) => typeof file?.type === 'string' && file.type.startsWith('video/');

  // 새로운 메시지를 받아 대화 목록에 추가하고 LLM 응답을 받는 함수 (LangChain 통합 멀티모달)
  const handleSendMessage = async (messageText, attachments) => {
    const hasText = !!(messageText && messageText.trim());
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!hasText && !hasAttachments) return;

    // 첨부파일을 dataUrl로 미리 변환하여 userMessage에 저장
    let processedAttachments = [];
    if (hasAttachments) {
      const imageFiles = attachments.filter(isImageFile);
      const videoFiles = attachments.filter(isVideoFile);
      
      console.log('미디어 파일 처리 시작:', { imageFiles: imageFiles.length, videoFiles: videoFiles.length });
      
      // 이미지와 영상 파일을 data URL로 변환
      const imageDataUrls = await Promise.all(imageFiles.map(fileToDataUrl));
      const videoDataUrls = await Promise.all(videoFiles.map(fileToDataUrl));
      
      console.log('데이터 URL 변환 완료:', { images: imageDataUrls.length, videos: videoDataUrls.length });
      
      // 변환된 dataUrl과 함께 저장
      processedAttachments = [
        ...imageFiles.map((file, index) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: imageDataUrls[index]
        })),
        ...videoFiles.map((file, index) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: videoDataUrls[index]
        }))
      ];
    }

    const userMessage = {
      text: hasText ? messageText : '',
      sender: 'user',
      attachments: processedAttachments,
    };

    // 먼저 사용자 메시지를 추가
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setIsLoading(true);
    try {
      // 🎯 핵심: 멀티모달 히스토리 구성 (LangChain 방식)
      const history = [...messages, userMessage].map(msg => {
        if (msg.sender === 'user') {
          // 첨부파일이 없는 경우 - 기존 텍스트 방식
          if (!msg.attachments || msg.attachments.length === 0) {
            return new HumanMessage(msg.text || '');
          }
          
          // 첨부파일이 있는 경우 - 멀티모달 콘텐츠 구성
          const contentParts = [];
          
          // 텍스트 추가
          if (msg.text && msg.text.trim()) {
            contentParts.push({ type: 'text', text: msg.text });
          }
          
          // 이미지/비디오 추가
          msg.attachments.forEach(attachment => {
            if (attachment.type && (attachment.type.startsWith('image/') || attachment.type.startsWith('video/'))) {
              contentParts.push({
                type: 'image_url',
                image_url: attachment.dataUrl
              });
            }
          });
          
          return new HumanMessage({ content: contentParts });
        } else {
          return new AIMessage(msg.text || '');
        }
      });

      console.log('LangChain 체인 호출 시작...');
      
      // 🚀 LangChain 체인만 사용 - 멀티모달도 동일한 체인으로 처리
      const response = await chain.invoke({
        input: hasText ? messageText : '', // 멀티모달인 경우 빈 문자열, 히스토리에서 처리됨
        history: history,
      });

      console.log("LangChain 체인 응답:", response);

      if (response && response.content) {
        const geminiMessage = { text: response.content, sender: 'gemini' };
        setMessages(prevMessages => [...prevMessages, geminiMessage]);
      } else {
        console.error("LangChain 체인 응답이 비어있습니다.");
        const errorMessage = { text: "죄송합니다. 응답을 생성하지 못했습니다.", sender: 'gemini' };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error("LangChain 체인 호출 중 오류 발생:", error);
      const errorMessage = { text: "죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.", sender: 'gemini' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="App">
      <Routes>
        {/* 앱의 초기 진입점: 웰컴 화면을 봤는지 여부에 따라 리다이렉트 */}
        <Route
          path="/"
          element={hasSeenWelcome ? <Navigate to="/main" /> : <Navigate to="/login" />}
        />
        {/* 로그인 관련 라우트 */}
        {/* WelcomePage에 handleSeenWelcome 함수를 전달하여, 웰컴 화면을 본 후 호출하도록 합니다. */}
        <Route path="/login" element={<WelcomePage onSeenWelcome={handleSeenWelcome} />} />
        <Route path="/login/email" element={<EmailLoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* 메인 화면 라우트 (이제 '/main' 경로로 접근) */}
        <Route
          path="/main"
          element={isLoggedIn ? <MainScreen onSendMessage={handleSendMessage} /> : <Navigate to="/login" />}
        />
        {/* 채팅 화면 라우트 */}
        <Route
          path="/chat"
          element={isLoggedIn ? (
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <Navigate to="/login" />
          )}
        />
        {/* 기타 보호된 라우트 */}
        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
export default App;