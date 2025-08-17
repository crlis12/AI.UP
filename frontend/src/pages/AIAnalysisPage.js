import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import '../App.css';

function AIAnalysisPage() {
  const [input1, setInput1] = useState('주간 리포트');

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  return (
    <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true}>
      <div className="analysis-page">
        <div className="contain">
          <div className="scroll-view">
            <div className="row-view">
              
              
            </div>

            <div className="row-view2">
              
              <span className="text">{"8월 2주차"}</span>
              <img
                src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/6przmqoe_expires_30_days.png"}
                className="image2"
                alt="dots"
              />
            </div>

            <span className="text2">{"종합 발달 점수 추이"}</span>

            <div className="column">
              <img
                src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/d3wxqip5_expires_30_days.png"}
                className="image3"
                alt="chart"
              />
              <div className="row-view3">
                <span className="text3">{"9/3"}</span>
                <span className="text4">{"10/1"}</span>
                <span className="text4">{"10/2"}</span>
                <span className="text4">{"10/3"}</span>
                <span className="text4">{"11/1"}</span>
                <span className="text5">{"11/2"}</span>
              </div>
            </div>

            <div className="view">
              <span className="text6">{"이번 주 언어 영역이 상승했어요."}</span>
            </div>

            <div className="column2">
              <div className="row-view4">
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/q31szwcd_expires_30_days.png"}
                  className="image4"
                  alt="muscle"
                />
                <span className="text7 metric-label">{"대근육"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/pvc0iwf6_expires_30_days.png"}
                  className="image5"
                  alt="up"
                />
                <span className="text8 metric-score">{"+2.1"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/q96vh959_expires_30_days.png"}
                  className="image4"
                  alt="fine"
                />
                <span className="text9 metric-label">{"소근육"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/enuvfi0x_expires_30_days.png"}
                  className="image5"
                  alt="down"
                />
                <span className="text10 metric-score">{"-0.8"}</span>
              </div>

              <div className="row-view4">
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/ivkhvlvy_expires_30_days.png"}
                  className="image4"
                  alt="cognitive"
                />
                <span className="text9 metric-label">{"인지"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/hy1mf4sa_expires_30_days.png"}
                  className="image5"
                  alt="up"
                />
                <span className="text11 metric-score">{"+1.5"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/ywabn5j0_expires_30_days.png"}
                  className="image4"
                  alt="language"
                />
                <span className="text12 metric-label">{"언어"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/i7n0o1z3_expires_30_days.png"}
                  className="image5"
                  alt="up"
                />
                <span className="text10 metric-score">{"+3.5"}</span>
              </div>

              <div className="row-view4">
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/3hvvj451_expires_30_days.png"}
                  className="image4"
                  alt="social"
                />
                <span className="text13 metric-label">{"사회성"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/vur6ovz5_expires_30_days.png"}
                  className="image5"
                  alt="down"
                />
                <span className="text8 metric-score">{"-1.2"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/h2zr3eqi_expires_30_days.png"}
                  className="image4"
                  alt="selfcare"
                />
                <span className="text9 metric-label">{"자조"}</span>
                <img
                  src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/cbo00il9_expires_30_days.png"}
                  className="image5"
                  alt="down"
                />
                <span className="text10 metric-score">{"-0.5"}</span>
              </div>
            </div>

            <div className="column3">
              <span className="text14">{"영역별 발달 비교"}</span>
              <div className="column4">
                <div className="metric-group">
                  <span className="text15">{"대근육"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view2">
                      <div className="box2" />
                    </div>
                    <span className="text17">{"80"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box3" />
                    </div>
                    <span className="text17">{"75"}</span>
                  </div>
                </div>

                <div className="metric-group">
                  <span className="text15">{"소근육"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view4">
                      <div className="box4" />
                    </div>
                    <span className="text17">{"65"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box5" />
                    </div>
                    <span className="text17">{"72"}</span>
                  </div>
                </div>

                <div className="metric-group">
                  <span className="text15">{"인지"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view5">
                      <div className="box6" />
                    </div>
                    <span className="text17">{"88"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box7" />
                    </div>
                    <span className="text17">{"80"}</span>
                  </div>
                </div>

                <div className="metric-group">
                  <span className="text15">{"언어"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view6">
                      <div className="box8" />
                    </div>
                    <span className="text17">{"90"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box9" />
                    </div>
                    <span className="text17">{"82"}</span>
                  </div>
                </div>

                <div className="metric-group">
                  <span className="text15">{"사회성"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view7">
                      <div className="box10" />
                    </div>
                    <span className="text17">{"40"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box11" />
                    </div>
                    <span className="text17">{"78"}</span>
                  </div>
                </div>

                <div className="metric-group">
                  <span className="text15">{"자조"}</span>
                  <div className="row-view5">
                    <span className="text16">{"내 아이"}</span>
                    <div className="view8">
                      <div className="box12" />
                    </div>
                    <span className="text17">{"60"}</span>
                  </div>
                  <div className="row-view6">
                    <span className="text18">{"또래 평균"}</span>
                    <div className="view3">
                      <div className="box13" />
                    </div>
                    <span className="text17">{"70"}</span>
                  </div>
                </div>
              </div>
            </div>

            <span className="text19">{"이 부분은 특별히 봐주세요!"}</span>
            <div className="view9">
              <span className="text20">{"사회성 영역에서 또래보다 발달이 느려요. \n전문가와 상담을 받아보는 건 어떨까요?"}</span>
            </div>
            <div className="view10">
              <span className="text21">{"상담사 연결하기"}</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default AIAnalysisPage;