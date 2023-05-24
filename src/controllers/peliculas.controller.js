import pkg from 'mssql';
const { MAX } = pkg;
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

export const getPeliculas = async (req, res) => {
  const firebaseConfig = {
    apiKey: "AIzaSyBADh0zs1OxNcoVsurGj-bwCfCUHsbTnyI",
    authDomain: "urbanbookingbot.firebaseapp.com",
    databaseURL: "https://urbanbookingbot-default-rtdb.firebaseio.com/",
    projectId: "urbanbookingbot",
    storageBucket: "urbanbookingbot.appspot.com",
    messagingSenderId: "111234008963",
    appId: "1:111234008963:web:5971541a631ec16b1558b6",
  };
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const billingDay = (theUserRef, remDays, timestamp) => {
    updateDoc(theUserRef, { remainingDays: remDays, billedDay: timestamp });
  };
  const billDay = async (user) => {
    console.log(user);
    var today = convertTZ(new Date(new Date().toDateString()), "America/Argentina/Buenos_Aires");
    const theUserRef = doc(db, "users", user.email);
  
    if (
      user.billedDay.toDate(new Date().toDateString()).toString().slice(0, 15) !==
      today.toString().slice(0, 15)
    ) {
      await billingDay(theUserRef, user.remainingDays - 1, Timestamp.fromDate(new Date()));
    }
  };
  
  const getUser = async () => {
    const q = query(collection(db, "users"));
  
    const querySnapshot = await getDocs(q);
    var users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    return users;
  };
  
  function padTo2Digits(num) {
    return num.toString().padStart(2, "0");
  }
  
  function convertTZ(date, tzString) {
    return new Date(
      (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
        timeZone: tzString,
      })
    );
  }
  
  function formatDate(date) {
    return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join(
      ""
    );
  }
  
  const currentDate = formatDate(convertTZ(new Date(), "America/Argentina/Buenos_Aires"));
  
  var myHeaders = new Headers({
    Authorization: "Bearer MjAyMjEwMTUxOTQwMjh8NmRmNDJiNzM0NWIzNDA1Yjg5NWU0YjY2YzRlMGY3Y2J8ZWMxZDM4ZDdkMzU5NDhkMGE2MGNkOGMwYjhmYjlkZjl8NnxBcmdlbnRpbmEgU3RhbmRhcmQgVGltZXxlcy1FU3wxODU4YjY0ZDQwYmQ0N2VlODAyNTU0N2U2ODgzM2ZjYnx8fHwxfDF8MHwxMDB8fHw1OHw1NTg1fDB8Y29tLm15d2VsbG5lc3M1.430C60AE825FD3A319D5A9B7BDD3A9CC37E3FDBAA342536197BBB8CDF3B95EEC5B05EC8AF7406DBA2F19704BD083850C1E42C7EE868BB5A965973660FE7E94F7",
    "Content-Type": "application/json",
    Cookie:
      "_mwapps=ec1d38d7-d359-48d0-a60c-d8c0b8fb9df9|MjAyMjEwMTUyMjAzMDd8NmRmNDJiNzM0NWIzNDA1Yjg5NWU0YjY2YzRlMGY3Y2J8ZWMxZDM4ZDdkMzU5NDhkMGE2MGNkOGMwYjhmYjlkZjl8NnxBcmdlbnRpbmEgU3RhbmRhcmQgVGltZXxlcy1FU3wxODU4YjY0ZDQwYmQ0N2VlODAyNTU0N2U2ODgzM2ZjYnx8fHwxfDF8MHwxMDB8fHw1OHw1NTg1fDB8Y29tLm15d2VsbG5lc3M1.79E7F833F6F53DC7CA86927EFACE10D42B1FFE178894D5D3287E5D0AE87C8345B9D61559B5FD3442BAD58600120B83FDF64D7357C111B4698E593ADD45BEA661",
  });
  
  var raw = JSON.stringify({
    timeScope: "Custom",
    dateLimit: 0,
    eventType: "Class",
    dateStart: currentDate,
  });
  
  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };
  
  async function getClasses() {
    try {
      let res = await fetch(
        "https://services.mywellness.com/Core/Facility/1c00b0c2-d2b7-46fe-bb98-6eef3be0ed7c/SearchCalendarEvents?_c=es-AR",
        requestOptions
      );
      return await res.json();
    } catch (error) {
      console.log(error);
    }
  }
  
  function getId(classes) {
    var today = convertTZ(new Date(), "America/Argentina/Buenos_Aires");
  
    let clases = classes.data.eventItems;
    let laclase = clases.find((o) => {
      if (o.startHour === today.getHours() + 1 && o.name === "FORCE 6") {
        return true;
      }
    });
    return laclase.id;
  }
  
  async function book(classID, user) {
    var raw2 = JSON.stringify({
      station: "5",
      userId: user.id,
      partitionDate: currentDate,
    });
  
    var requestOptions2 = {
      method: "POST",
      headers: myHeaders,
      body: raw2,
      redirect: "follow",
    };
  
    try {
      let res = await fetch(
        "https://services.mywellness.com/core/calendarevent/" + classID + "/book?_c=es-AR",
        requestOptions2
      );
      console.log(await res.json());
      billDay(user);
    } catch (error) {
      console.log(error);
    }
  }
  
  const run = async () => {
    var today = convertTZ(new Date(), "America/Argentina/Buenos_Aires");
    var users = await getUser();
    let classes = await getClasses();
    let classID = getId(classes);
  
    users.forEach((user) => {
      if (user.remainingDays > 0) {
        switch (today.getDay() - 1) {
          case 0: {
            if (user.Mon[0] - 1 === today.getHours() || user.Mon[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Mon[0] - 1) + " o las " + (user.Mon[1] - 1)
              );
            }
            break;
          }
  
          case 1: {
            if (user.Tue[0] - 1 === today.getHours() || user.Tue[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Tue[0] - 1) + " o las " + (user.Tue[1] - 1)
              );
            }
            break;
          }
  
          case 2: {
            if (user.Wed[0] - 1 === today.getHours() || user.Wed[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Wed[0] - 1) + " o las " + (user.Wed[1] - 1)
              );
            }
            break;
          }
  
          case 3: {
            if (user.Thu[0] - 1 === today.getHours() || user.Thu[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Thu[0] - 1) + " o las " + (user.Thu[1] - 1)
              );
            }
            break;
          }
  
          case 4: {
            if (user.Fri[0] - 1 === today.getHours() || user.Fri[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Fri[0] - 1) + " o las " + (user.Fri[1] - 1)
              );
            }
            break;
          }
  
          case 5: {
            if (user.Sat[0] - 1 === today.getHours() || user.Sat[1] - 1 === today.getHours()) {
              book(classID, user);
            } else {
              console.log(
                user.email + ": No son las " + (user.Sat[0] - 1) + " o las " + (user.Sat[1] - 1)
              );
            }
            break;
          }
        }
      }
    });
  };
  if(convertTZ(new Date(), "America/Argentina/Buenos_Aires").getDay() !== 0){
    run()
    return StatusCode(500);
  }else{
    return StatusCode(500);
  }
};


