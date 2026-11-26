// 창업 단계별 정부지원사업 로드맵.
// 사업 카드를 누르면 detail 의 내용으로 상세 모달이 열립니다.
//   eligibility : 카드에 보이는 한 줄 지원 조건
//   detail.summary / period(신청 시기) / scale(규모) / conditions(자격 조건)
//   detail.links : 원문 링크 버튼. 여러 개를 넣으면 버튼이 각각 생깁니다. [{ label, url }]
// 내용은 각 사업의 공고 원문을 기준으로 정리했습니다. 새 공고가 나오면 이 파일만 고치면 됩니다.
export const ROADMAP_STAGES = [
  {
    "id": "prepare",
    "number": "01",
    "title": "창업 준비",
    "period": "예비창업 ~ 3년 이하",
    "programs": [
      {
        "id": "modoo",
        "title": "모두의 창업",
        "eligibility": "예비창업 ~ 7년 이내",
        "href": null,
        "detail": {
          "summary": "창의적인 아이디어를 가진 국민 누구나 도전할 수 있는 중소벤처기업부의 오디션형 창업 지원 프로젝트입니다. 라운드를 거치며 창업활동자금과 멘토링, 사업화 자금을 단계적으로 지원받습니다.",
          "period": [
            "2026년 1차: 3월 공고 (마감)",
            "2026년 2차: 8월 20일 ~ 9월 17일 16시 (마감)"
          ],
          "scale": [
            "2차 기준 총 10,000명 선발 (일반 · 기술트랙 8,000명, 로컬트랙 2,000명)",
            "1라운드: 창업활동자금 200만 원 + 멘토링",
            "2라운드 진출 시: 시제품 제작 · 사업화 자금 지원"
          ],
          "conditions": [
            "공고일 기준 사업자등록이 없는 예비창업자",
            "업력 7년 이내 기창업자 중 기존 사업과 다른 업종으로 창업하려는 대표자 (이종창업)",
            "공동대표는 전원이 자격을 충족해야 함"
          ],
          "links": [
            {
              "label": "모두의 창업 바로가기",
              "url": "https://www.modoo.or.kr/"
            }
          ]
        }
      },
      {
        "id": "pre-startup",
        "title": "예비창업패키지",
        "eligibility": "예비창업자",
        "href": null,
        "detail": {
          "summary": "혁신적인 기술과 사업모델(BM)을 보유한 예비창업자를 발굴 · 지원하는 사업입니다. 사업화 자금과 창업 프로그램을 지원합니다.",
          "period": [
            "2026년: 3월 6일 ~ 3월 26일 18시 (마감)"
          ],
          "scale": [
            "사업화 자금 평균 0.4억 원 + 창업 프로그램",
            "1단계: 시장조사 · 최소기능제품(MVP) 제작 등 사업화 준비 자금 2,000만 원",
            "2단계: 중간 평가로 50% 내외를 선정해 추가 지원"
          ],
          "conditions": [
            "신청자 명의의 사업자등록증이 없는 사람",
            "법인의 법률상 대표권을 가지고 있지 않은 사람 (기준일 2026년 1월 22일)",
            "자격 예외 요건 등은 공고문 참조"
          ],
          "links": [
            {
              "label": "공고 원문 보기",
              "url": "https://www.k-startup.go.kr/web/s/B3trvDahmL"
            }
          ]
        }
      },
      {
        "id": "startup-university",
        "title": "창업중심대학",
        "eligibility": "예비창업 ~ 7년 이내",
        "href": null,
        "detail": {
          "summary": "창업중심대학의 인프라를 활용해 우수한 창업 아이템을 가진 (예비)창업기업의 사업화를 지원하는 사업입니다. 지역기반 · 대학발 · 딥테크 특화 세 가지로 나누어 모집합니다.",
          "period": [
            "지역기반 · 대학발: 2026년 3월 3일 ~ 3월 24일 18시 (마감)",
            "딥테크 특화: 2026년 6월 19일 ~ 7월 21일 16시 (마감)"
          ],
          "scale": [
            "지역기반: 사업화 자금 평균 0.5억 원 내외 (최대 1억 원)",
            "대학발: 사업화 자금 평균 0.7억 원 내외 (최대 1.5억 원)",
            "딥테크 특화: 사업화 자금 평균 1.6억 원 내외 (최대 2억 원)",
            "공통: 창업 프로그램 지원"
          ],
          "conditions": [
            "지역기반: 예비창업자부터 업력 7년 이내 창업기업",
            "대학발: 예비창업자부터 업력 7년 이내 대학발 창업기업",
            "딥테크 특화: 신산업 분야의 창업 10년 이내 기업으로, 과학기술원(GIST · DGIST · UNIST · KAIST) 소속(졸업 후 5년 이내 포함)이거나 과학기술원에서 기술이전을 받은 기업"
          ],
          "links": [
            {
              "label": "지역기반 공고",
              "url": "https://www.k-startup.go.kr/web/s/mBesvDahmL"
            },
            {
              "label": "대학발 공고",
              "url": "https://www.k-startup.go.kr/web/s/KTIytIHhmL"
            },
            {
              "label": "딥테크 특화 공고",
              "url": "https://www.k-startup.go.kr/web/s/kyCjvDahmL"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "start",
    "number": "02",
    "title": "초기 · 재도전",
    "period": "예비창업 ~ 3년 이하",
    "programs": [
      {
        "id": "early-startup",
        "title": "초기창업패키지",
        "eligibility": "창업 후 3년 이내",
        "href": null,
        "detail": {
          "summary": "유망 창업 아이템과 기술을 보유한 초기창업기업의 사업 안정화와 성장을 지원하는 사업입니다. 일반형과 딥테크 특화형으로 나누어 모집합니다.",
          "period": [
            "일반형: 2026년 1월 23일 ~ 2월 13일 16시 (마감)",
            "딥테크 특화형: 2026년 1월 6일 ~ 1월 27일 16시 (마감)"
          ],
          "scale": [
            "일반형: 사업화 자금 평균 0.5억 원 내외 (최대 1억 원)",
            "딥테크 특화형: 사업화 자금 평균 1.3억 원 내외 (최대 1.5억 원)",
            "공통: 창업 프로그램 지원"
          ],
          "conditions": [
            "일반형: 창업 후 3년 이내 초기창업기업",
            "딥테크 특화형: 딥테크 5대 분야(빅데이터 · AI, 로봇, 바이오 · 헬스, 미래모빌리티, 친환경 · 에너지)의 창업 후 3년 이내 초기창업기업"
          ],
          "links": [
            {
              "label": "일반형 공고",
              "url": "https://www.k-startup.go.kr/web/s/FNFqoychmL"
            },
            {
              "label": "딥테크 특화형 공고",
              "url": "https://www.k-startup.go.kr/web/s/HMRhwR9hmL"
            }
          ]
        }
      },
      {
        "id": "startup-success",
        "title": "창업성공패키지",
        "eligibility": "만 39세 이하 · 창업 3년 이내",
        "href": null,
        "detail": {
          "summary": "유망 창업 아이템과 혁신 기술을 보유한 청년 창업자를 발굴해 사업화를 지원하는 사업입니다. 청년창업사관학교 기본과정과 글로벌창업사관학교로 운영됩니다.",
          "period": [
            "기본과정 · 글로벌: 2026년 1월 30일 ~ 2월 13일 16시 (마감)"
          ],
          "scale": [
            "기본과정: 사업화 자금 평균 0.7억 원 (최대 1억 원) + 창업 프로그램",
            "글로벌: 해외 진출을 위한 단계별 패키지 지원 (사업화 지원금, 사전진단 · 멘토링, 진출 준비, 현지 진출, 투자유치 등)"
          ],
          "conditions": [
            "기본과정: 만 39세 이하, 창업 후 3년 이내 대표자 (경험창업자는 창업 후 7년 이내까지)",
            "글로벌: 만 39세 이하, 창업 7년 이내 기업 중 글로벌 확장성이 높은 초격차 · 신산업 · 기후기술 분야 스타트업",
            "글로벌: 청년창업사관학교 · 글로벌창업사관학교(2020 ~ 2023) 졸업기업은 분야 · 연령 제한 없음"
          ],
          "links": [
            {
              "label": "기본과정 공고",
              "url": "https://www.k-startup.go.kr/web/s/qxPlqychmL"
            },
            {
              "label": "글로벌 공고",
              "url": "https://www.k-startup.go.kr/web/s/6d6q8L0hmL"
            }
          ]
        }
      },
      {
        "id": "restart",
        "title": "재도전성공패키지",
        "eligibility": "예비재창업 ~ 재창업 7년 이내",
        "href": null,
        "detail": {
          "summary": "성실한 실패 경험과 우수한 아이템을 가진 (예비)재창업기업을 발굴해 재창업을 패키지로 지원하는 사업입니다.",
          "period": [
            "2026년: 2월 11일 ~ 3월 4일 16시 (마감)"
          ],
          "scale": [
            "사업화 자금 지원",
            "심리치유, 실패 원인 분석, 맞춤형 멘토링, 투자 연계 등"
          ],
          "conditions": [
            "폐업 이력이 있는 예비재창업자",
            "재창업 후 7년 이내 재창업기업"
          ],
          "links": [
            {
              "label": "공고 원문 보기",
              "url": "https://www.k-startup.go.kr/web/contents/bizpbanc-deadline.do?schM=view&pbancSn=175869&pbancEndYn=Y"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "grow",
    "number": "03",
    "title": "성장 · 도약",
    "period": "창업 3 ~ 10년",
    "programs": [
      {
        "id": "startup-leap",
        "title": "창업도약패키지",
        "eligibility": "창업 3년 초과 ~ 7년 이내",
        "href": null,
        "detail": {
          "summary": "도약기 창업기업의 성장과 도약을 지원하는 사업입니다. 일반형과 딥테크 특화형으로 나누어 모집합니다.",
          "period": [
            "일반형: 2026년 1월 23일 ~ 2월 13일 16시 (마감)",
            "딥테크 특화형: 2026년 1월 6일 ~ 1월 27일 16시 (마감)"
          ],
          "scale": [
            "사업화 자금 지원 (금액은 공고문의 세부 지원내용 참조)",
            "주관기관이 제공하는 창업 프로그램"
          ],
          "conditions": [
            "일반형: 창업 후 3년 초과 7년 이내 기업 (신산업 창업 분야는 창업 후 10년 이내까지)",
            "딥테크 특화형: 딥테크 5대 분야에 해당하는 창업 3년 초과 10년 이내 기업"
          ],
          "links": [
            {
              "label": "일반형 공고",
              "url": "https://www.k-startup.go.kr/web/s/jAFqoR9hmL"
            },
            {
              "label": "딥테크 특화형 공고",
              "url": "https://www.k-startup.go.kr/web/s/bpjLAR9hmL"
            }
          ]
        }
      },
      {
        "id": "lips",
        "title": "LIPS",
        "eligibility": "업력 1년 이상 소상공인",
        "href": null,
        "detail": {
          "summary": "민간투자와 연계해 생활기반(비기술)의 창의적 아이템을 가진 소상공인의 성장과 도약을 지원하는 소상공인 투자연계 지원사업입니다.",
          "period": [
            "2026년: 4월 1일 ~ 12월 31일 18시 (예산 소진 시까지)"
          ],
          "scale": [
            "LIPSⅠ 민간투자 연계형 매칭융자: 운영사 선투자금의 최대 5배, 최대 5억 원 한도의 정책자금",
            "LIPSⅡ 혁신소상공인 투자연계지원: 사업화 자금 지원 (세부 내용은 공고문 참조)"
          ],
          "conditions": [
            "중소벤처기업부가 지정한 운영사로부터 먼저 투자를 받은 유망 소상공인",
            "업력 1년 미만, 7년 이상 소상공인은 제외"
          ],
          "links": [
            {
              "label": "공고 원문 보기",
              "url": "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000120117"
            }
          ]
        }
      }
    ]
  },
  {
    "id": "scale",
    "number": "04",
    "title": "확장 · 고도화",
    "period": "창업 3 ~ 10년",
    "programs": [
      {
        "id": "dips",
        "title": "DIPS",
        "eligibility": "신산업 · 창업 10년 이내",
        "href": null,
        "detail": {
          "summary": "독보적인 기술 우위로 글로벌 시장을 선도할 6대 전략산업 · 12대 신산업 분야 창업기업을 육성하는 초격차 스타트업 프로젝트입니다.",
          "period": [
            "2026년: 2025년 12월 29일 ~ 2026년 1월 23일 15시 (마감)"
          ],
          "scale": [
            "창업사업화 자금 최대 2억 원 (평균 1.5억 원 내외)",
            "초격차 3대 프로그램: 기술사업화, 개방형 혁신, 투자유치",
            "기술개발(R&D) 연계, 정책자금, 기술보증 등 우대"
          ],
          "conditions": [
            "6대 전략산업 · 12대 신산업 기술을 영위하는 창업 10년 이내 스타트업"
          ],
          "links": [
            {
              "label": "공고 원문 보기",
              "url": "https://www.k-startup.go.kr/web/s/QjS2YykhmL"
            }
          ]
        }
      }
    ]
  }
];

export const TIPS_FLOW = [
  {
    "id": "pre-tips",
    "title": "Pre-TIPS",
    "eligibility": "비수도권 · 창업 3년 이내",
    "href": null,
    "detail": {
      "summary": "민간투자와 연계해 비수도권의 유망 창업기업을 발굴하고 예비 팁스(TIPS) 기업으로 육성하는 사업입니다.",
      "period": [
        "2026년 1차: 3월 19일 ~ 4월 20일 16시 (마감)",
        "2026년 2차: 7월 10일 ~ 8월 10일 16시 (마감)"
      ],
      "scale": [
        "사업화 자금 평균 9,000만 원 (최대 1억 원): 시제품 제작, 지재권 취득, 사업모델 개선 등",
        "창업 프로그램: 지역 펀드 연계 IR, 후속투자 유치 멘토링, 역량 강화 프로그램"
      ],
      "conditions": [
        "투자기관으로부터 1,000만 원 이상 투자를 받은 기업",
        "비수도권 소재, 창업 3년 이내 초기 창업기업"
      ],
      "links": [
        {
          "label": "1차 공고",
          "url": "https://www.k-startup.go.kr/web/s/b5vWvDahmL"
        },
        {
          "label": "2차 공고",
          "url": "https://www.k-startup.go.kr/web/s/c5vWvDahmL"
        }
      ]
    }
  },
  {
    "id": "tips",
    "title": "TIPS",
    "eligibility": "운영사 투자 · 추천 기업",
    "href": null,
    "detail": {
      "summary": "팁스 운영사의 투자와 추천을 받은 창업기업에 기술개발(R&D) 자금을 지원하고, 사업화와 해외 마케팅까지 연계하는 민간투자 주도형 기술창업 지원 프로그램입니다.",
      "period": [
        "2026년: 3월 19일 ~ 12월 31일 18시 (모집 중)"
      ],
      "scale": [
        "팁스(R&D): 지원 기간 24개월, 최대 8억 원",
        "딥테크 팁스(R&D): 지원 기간 36개월, 최대 15억 원",
        "연계사업(창업사업화 · 해외마케팅): 각 10개월, 최대 1.5억 원 (합계 최대 3억 원)",
        "2026년 지원 규모: R&D 총 1,624억 원, 연계사업 총 650억 원"
      ],
      "conditions": [
        "팁스(R&D): 팁스 운영사로부터 투자와 추천을 받은 (예비)창업기업",
        "딥테크 팁스(R&D): 팁스 일반트랙 최종평가에서 '완료' 판정을 받은 12대 신산업 분야 창업기업",
        "연계사업: 2025년까지 팁스 R&D에 협약(완료)한 창업기업"
      ],
      "links": [
        {
          "label": "공고 원문 보기",
          "url": "https://www.k-startup.go.kr/web/s/f3ClBYkhmL"
        }
      ]
    }
  },
  {
    "id": "post-tips",
    "title": "Post-TIPS",
    "eligibility": "TIPS 성공 · 창업 7년 이내",
    "href": null,
    "detail": {
      "summary": "팁스 R&D를 성공적으로 마친 창업기업이 글로벌 기업으로 성장할 수 있도록 후속 사업화 자금을 지원하는 사업입니다.",
      "period": [
        "2025년 공고 기준: 8월 1일 ~ 8월 20일 18시 (마감)"
      ],
      "scale": [
        "사업화 자금 최대 7억 원 (평균 3.3억 원)"
      ],
      "conditions": [
        "팁스 R&D '완료(성공)' 판정을 받은 창업기업",
        "창업 후 7년 이내",
        "주관기관을 통해 팁스 성공기업 확인 후 신청"
      ],
      "links": [
        {
          "label": "공고 원문 보기",
          "url": "https://www.k-startup.go.kr/web/s/ZHyXvDahmL"
        }
      ]
    }
  }
];

export const ROADMAP_NOTE =
  '지원 조건과 일정은 각 사업의 2026년 공고(Post-TIPS 는 2025년 공고) 기준입니다. 실제 신청 자격과 지원 내용은 최신 공고를 확인해 주세요. 단계별 사업은 필수 순서가 아닙니다.';

export const ROADMAP_PROGRAM_COUNT =
  ROADMAP_STAGES.reduce((sum, stage) => sum + stage.programs.length, 0) + TIPS_FLOW.length;
