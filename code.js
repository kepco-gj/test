// [설정] 본인의 ID 정보가 정확한지 확인하세요.
const FOLDER_ID = '13-QfyxCq40BhE8twBJiADh7po10zJKoo'; 
const SHEET_ID = '15-AupqkUI3Jv5WabMoIC6mEBMaM4UoNBaBWt39x45z8';
const SHEET_NAME = 'Reservations';
const ADMIN_PASSWORD = "kepco123456/"; 

/**
 * 공통 함수: 시트 연결 및 초기화
 * openById를 사용하여 서버 측 연결 오류를 원천 차단합니다.
 */
function getResSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['타임스탬프', '예약일', '시간', '업체명', '차량번호1', '차량번호2', '자재정보', '연락처', '인원정보', '서류1', '서류2', '서류3', '상태']);
    }
    return sheet;
  } catch (e) {
    throw new Error("시트 연결 실패! ID와 권한을 확인하세요: " + e.message);
  }
}

function doGet(e) {
  const page = e.parameter.mode === 'admin' ? 'Admin' : 'Index';
  return HtmlService.createTemplateFromFile(page)
      .evaluate()
      .setTitle('자재센터 불용자재 환입차량 예약시스템')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 예약 가능한 슬롯 확인
 * 30분 단위, 타임당 최대 차량 2대(v1+v2) 제한 로직 적용
 */
function getAvailableSlots(selectedDate) {
  try {
    const sheet = getResSheet();
    const data = sheet.getDataRange().getValues();
    const slots = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
    
    let occupancy = {};
    slots.forEach(s => occupancy[s] = 0);

    for (let i = 1; i < data.length; i++) {
      let rowDate = Utilities.formatDate(new Date(data[i][1]), "GMT+9", "yyyy-MM-dd");
      if (rowDate === selectedDate && data[i][12] !== "반려") {
        let time = data[i][2];
        let v1 = data[i][4] ? 1 : 0;
        let v2 = data[i][5] ? 1 : 0;
        if (occupancy[time] !== undefined) occupancy[time] += (v1 + v2);
      }
    }
    return slots.filter(s => occupancy[s] < 2);
  } catch (e) {
    throw new Error("슬롯 조회 오류: " + e.message);
  }
}

/**
 * 예약 처리 및 파일 업로드
 * 신청자당 1일 1회 제한 로직 포함
 */
function submitReservation(form) {
  const sheet = getResSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    let rowDate = Utilities.formatDate(new Date(data[i][1]), "GMT+9", "yyyy-MM-dd");
    if (rowDate === form.date && data[i][7] == form.contact && data[i][12] !== "반려") {
      throw new Error("이미 해당 날짜에 예약 신청 내역이 존재합니다. (1일 1회 제한)");
    }
  }

  const folder = DriveApp.getFolderById(FOLDER_ID);
  const uploadFile = (fileObj) => {
    if (!fileObj || fileObj.size === 0) return "";
    let blob = Utilities.newBlob(Utilities.base64Decode(fileObj.data), fileObj.mimeType, fileObj.name);
    return folder.createFile(blob).getUrl();
  };

  const fileUrl1 = uploadFile(form.file1);
  const fileUrl2 = uploadFile(form.file2);
  const fileUrl3 = uploadFile(form.file3);

  sheet.appendRow([
    new Date(), form.date, form.time, form.company, 
    form.car1, form.car2, form.material, form.contact, form.people,
    fileUrl1, fileUrl2, fileUrl3, "대기"
  ]);

  return "예약이 성공적으로 접수되었습니다.";
}

function checkAdminPassword(inputPw) {
  return inputPw === ADMIN_PASSWORD;
}

// function getAdminEvents(inputPw) {
//   if (inputPw !== ADMIN_PASSWORD) throw new Error("권한이 없습니다.");
  
//   const sheet = getResSheet();
//   if (!sheet) throw new Error("시트를 찾을 수 없습니다. 시트 ID를 확인하세요.");
  
//   const data = sheet.getDataRange().getValues();
//   const events = [];

//   // 헤더 제외, 반려 건 제외하고 루프
//   for (let i = 1; i < data.length; i++) {
//     const row = data[i];
//     if (row[12] === "반려" || !row[1] || !row[2]) continue;

//     try {
//       // 1. 날짜 처리 (YYYY-MM-DD)
//       const dateObj = (row[1] instanceof Date) ? row[1] : new Date(row[1]);
//       const dateStr = Utilities.formatDate(dateObj, "GMT+9", "yyyy-MM-dd");
      
//       // 2. 시간 처리 (HH:mm)
//       // 시트의 시간 데이터가 Date 객체인 경우와 문자열인 경우 모두 대응
//       let timeStr = row[2];
//       if (timeStr instanceof Date) {
//         timeStr = Utilities.formatDate(timeStr, "GMT+9", "HH:mm");
//       } else {
//         timeStr = timeStr.toString().substring(0, 5); // "08:30:00" -> "08:30"
//       }

//       events.push({
//         title: row[3],
//         start: dateStr + 'T' + timeStr, // FullCalendar 표준 포맷
//         color: row[12] === '승인' ? '#004795' : '#f39c12',
//         extendedProps: {
//           company: row[3],
//           cars: `${row[4]} ${row[5] ? '/ ' + row[5] : ''}`,
//           material: row[6],
//           contact: row[7],
//           people: row[8],
//           status: row[12] || '대기',
//           files: [row[9], row[10], row[11]]
//         }
//       });
//     } catch (err) {
//       console.warn((i+1) + "행 데이터 변환 실패: " + err.message);
//     }
//   }
//   return events;
// }
function getAdminEvents(inputPw) {
  if (inputPw !== ADMIN_PASSWORD) {
    throw new Error("권한이 없습니다.");
  }

  const sheet = getResSheet();
  const data = sheet.getDataRange().getValues();
  const events = [];

  const tz = Session.getScriptTimeZone(); // 프로젝트 설정 시간대 사용

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // 반려 건 제외 + 날짜/시간 없는 행 제외
    if (row[12] === "반려" || !row[1] || !row[2]) continue;

    try {
      /* -------------------------
         1️⃣ 날짜 처리 (YYYY-MM-DD 고정)
      ------------------------- */
      let dateStr;
      if (row[1] instanceof Date) {
        dateStr = Utilities.formatDate(row[1], tz, "yyyy-MM-dd");
      } else {
        dateStr = String(row[1]).substring(0, 10);
      }

      /* -------------------------
         2️⃣ 시간 처리 (HH:mm 강제 고정)
         - Date 타입이면 HH:mm 추출
         - 문자열이면 앞 5자리
         - 초 제거
      ------------------------- */
      let timeStr;

      if (row[2] instanceof Date) {
        timeStr = Utilities.formatDate(row[2], tz, "HH:mm");
      } else {
        timeStr = String(row[2]).trim().substring(0, 5);
      }

      // 혹시 08:30:00 형태면 강제 보정
      if (timeStr.length > 5) {
        timeStr = timeStr.substring(0, 5);
      }

      /* -------------------------
         3️⃣ ISO 포맷 생성 (초 00 고정)
      ------------------------- */
      const startISO = `${dateStr}T${timeStr}:00`;

      events.push({
        title: row[3],
        start: startISO,
        color: row[12] === '승인' ? '#004795' : '#f39c12',
        extendedProps: {
          company: row[3],
          cars: `${row[4]} ${row[5] ? '/ ' + row[5] : ''}`,
          material: row[6],
          contact: row[7],
          people: row[8],
          status: row[12] || '대기',
          files: [row[9], row[10], row[11]]
        }
      });

    } catch (err) {
      console.warn((i+1) + "행 데이터 변환 실패: " + err.message);
    }
  }

  return events;
}