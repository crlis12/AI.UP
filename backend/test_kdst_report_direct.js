#!/usr/bin/env node

const { runReportAgent } = require('./services/reportAgent');

async function testKDSTReportDirect() {
  console.log('🧪 KDST RAG → ReportAgent 직접 연결 테스트');
  console.log('=' * 60);
  
  try {
    // 1. KDST RAG 결과를 직접 생성 (하드코딩)
    console.log('1️⃣ KDST RAG 결과 준비...');
    
    const kdstRagContext = {
      kdst_questions: [
        "엎드린 자세에서 뒤집는다.",
        "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
        "누워 있을 때 자기 발을 잡고 논다"
      ],
      rag_results: [
        {
          "문제": "엎드린 자세에서 뒤집는다.",
          "일기": [
            {
              "diary_id": 21,
              "text": "8월 15일 : 오늘은 장난감을 한 손에서 다른 손으로 옮기는 걸 성공했다. 거울을 보여주자 자기 얼굴을 보며 활짝 웃는다. 스스로를 인식하진 못하겠지만, 무언가 재미있어 하는 게 분명하다.",
              "date": "8월 15일",
              "similarity": 0.3159
            },
            {
              "diary_id": 23,
              "text": "8월 17일 : 밤에 잠시 깼지만 내가 토닥여 주자 금세 다시 잠들었다. 낮에는 옆으로 데굴데굴 굴러 방 한쪽 끝까지 이동했다. 호기심이 점점 커지는 게 느껴졌다. 이번 주는 한층 더 활발하고 반응이 풍부해진 일주일이었다.",
              "date": "8월 17일",
              "similarity": 0.3006
            },
            {
              "diary_id": 19,
              "text": "8월 13일 : 잠깐 혼자 앉으려는 시도를 했다. 금세 휘청거리며 넘어지지만 조금씩 균형을 잡는다. 오늘은 이유식을 두세 숟갈 먹었는데, 처음보다 표정이 한결 여유롭다. 숟가락을 뺏으려는 모습까지 보여서 놀랐다.",
              "date": "8월 13일",
              "similarity": 0.2969
            }
          ]
        },
        {
          "문제": "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
          "일기": [
            {
              "diary_id": 19,
              "text": "8월 13일 : 잠깐 혼자 앉으려는 시도를 했다. 금세 휘청거리며 넘어지지만 조금씩 균형을 잡는다. 오늘은 이유식을 두세 숟갈 먹었는데, 처음보다 표정이 한결 여유롭다. 숟가락을 뺏으려는 모습까지 보여서 놀랐다.",
              "date": "8월 13일",
              "similarity": 0.3623
            },
            {
              "diary_id": 23,
              "text": "8월 17일 : 밤에 잠시 깼지만 내가 토닥여 주자 금세 다시 잠들었다. 낮에는 옆으로 데굴데굴 굴러 방 한쪽 끝까지 이동했다. 호기심이 점점 커지는 게 느껴졌다. 이번 주는 한층 더 활발하고 반응이 풍부해진 일주일이었다.",
              "date": "8월 17일",
              "similarity": 0.3376
            },
            {
              "diary_id": 18,
              "text": "8월 12일 : 낮잠에서 깬 아기가 혼자 웃음을 터뜨렸다. 다리를 번쩍 들고 발끝을 잡으려는 모습이 너무 귀엽다. 수유할 때 내 눈을 똑바로 바라보는데, 눈빛 속 교감이 깊어졌다.",
              "date": "8월 12일",
              "similarity": 0.3292
            }
          ]
        },
        {
          "문제": "누워 있을 때 자기 발을 잡고 논다",
          "일기": [
            {
              "diary_id": 17,
              "text": "8월 11일 : 오늘은 아기가 혼자 뒤집은 뒤 장난감을 잡으려고 손을 뻗었다. 아직은 손끝이 서툴지만, 의지가 보여서 대견하다. \"바바바\" 옹알이를 하길래 따라 해주니 까르르 웃었다. 점점 소통이 되는 기분이다.",
              "date": "8월 11일",
              "similarity": 0.3653
            },
            {
              "diary_id": 21,
              "text": "8월 15일 : 오늘은 장난감을 한 손에서 다른 손으로 옮기는 걸 성공했다. 거울을 보여주자 자기 얼굴을 보며 활짝 웃는다. 스스로를 인식하진 못하겠지만, 무언가 재미있어 하는 게 분명하다.",
              "date": "8월 15일",
              "similarity": 0.3250
            },
            {
              "diary_id": 18,
              "text": "8월 12일 : 낮잠에서 깬 아기가 혼자 웃음을 터뜨렸다. 다리를 번쩍 들고 발끝을 잡으려는 모습이 너무 귀엽다. 수유할 때 내 눈을 똑바로 바라보는데, 눈빛 속 교감이 깊어졌다.",
              "date": "8월 12일",
              "similarity": 0.3203
            }
          ]
        }
      ]
    };
    
    console.log('✅ RAG 컨텍스트 준비 완료');
    console.log(`총 문제 수: ${kdstRagContext.kdst_questions.length}`);
    console.log(`총 관련 일기 수: ${kdstRagContext.rag_results.reduce((sum, r) => sum + r.일기.length, 0)}`);
    console.log();
    
    // 2. ReportAgent로 보고서 생성
    console.log('2️⃣ ReportAgent로 KDST 보고서 생성...');
    
    const reportConfig = {
      vendor: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.7
    };
    
    const reportSpec = {
      reportType: 'KDST Development Assessment Report',
      audience: 'Child Development Professionals and Parents',
      tone: 'Professional and Informative',
      length: 'Comprehensive',
      language: 'Korean',
      format: 'Markdown',
      includeSummary: true,
      sections: [
        'Executive Summary',
        'KDST Question Analysis',
        'Behavioral Observations',
        'Development Assessment',
        'Recommendations'
      ]
    };
    
    const reportInput = `
KDST 문제들에 대한 RAG 검색 결과를 바탕으로 전문적인 아기 발달 평가 보고서를 작성해주세요.

각 KDST 문제별로:
1. 문제의 의미와 발달적 중요성
2. 관련 일기 내용을 바탕으로 한 행동 관찰 분석
3. 현재 발달 단계 평가
4. 향후 발달 방향 제안

RAG 검색 결과의 일기 내용을 구체적으로 인용하여 근거를 제시해주세요.
`;
    
    const reportResult = await runReportAgent({
      input: reportInput,
      history: [],
      context: {},
      config: reportConfig,
      spec: reportSpec,
      kdstRagContext: kdstRagContext
    });
    
    console.log('✅ 보고서 생성 완료');
    console.log();
    
    // 3. 생성된 보고서 출력
    console.log('3️⃣ 생성된 KDST 보고서:');
    console.log('=' * 60);
    console.log(reportResult.content);
    console.log('=' * 60);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

// 테스트 실행
testKDSTReportDirect();
