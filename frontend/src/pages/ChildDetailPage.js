import React, { useState } from 'react';
import './ChildDetailFigma.css';
import PageLayout from '../components/PageLayout';

function ChildDetailPage() {
  const [input1, setInput1] = useState('');
  const onChangeInput1 = (v) => setInput1(v);

  return (
    <PageLayout title="아이 정보" showNavBar={true}>
      <div className="child-info-page contain">
        <div className="scroll-view">
          <div className="column">
            <div className="view">
              <div className="column2">
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/2d8zb17o_expires_30_days.png'
                  }
                  className="image2"
                  alt="profile"
                />
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/kwrjxphl_expires_30_days.png'
                  }
                  className="absolute-image"
                  alt="edit"
                />
              </div>
            </div>
            <div className="view2">
              <span className="text">{''}</span>
            </div>
            <span className="text2">{''}</span>
            <div className="column3">
              <span className="text3">{'기본 정보'}</span>
              <div className="row-view2">
                <div className="column4">
                  <span className="text4">{'성별'}</span>
                  <span className="text5">{''}</span>
                </div>
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/i77hklqx_expires_30_days.png'
                  }
                  className="image3"
                  alt="edit"
                />
              </div>
              <span className="text6">{'생년월일'}</span>
              <div className="row-view2">
                <span className="text7">{''}</span>
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/xq1hcauy_expires_30_days.png'
                  }
                  className="image3"
                  alt="edit"
                />
              </div>
              <span className="text6">{'체중'}</span>
              <div className="row-view2">
                <span className="text8">{''}</span>
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/kucwi3nl_expires_30_days.png'
                  }
                  className="image3"
                  alt="edit"
                />
              </div>
              <div className="row-view2">
                <div className="column5">
                  <span className="text4">{'키'}</span>
                  <span className="text5">{''}</span>
                </div>
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/fwiethdd_expires_30_days.png'
                  }
                  className="image3"
                  alt="edit"
                />
              </div>
              <span className="text9">{'특이사항'}</span>
              <div className="row-view3">
                <span className="text5">{''}</span>
                <img
                  src={
                    'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/nwim1sc8_expires_30_days.png'
                  }
                  className="image4"
                  alt="edit"
                />
              </div>
            </div>
            {/* 하단 이미지 탭 제거: 공통 BottomNavBar 사용 */}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ChildDetailPage;
