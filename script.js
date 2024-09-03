// script.js
const elVideo = document.getElementById("video");
const registeredPeople = [];
var lastRecognitionTime = null;
const recognitionTimes = {};
const contadores = {
  Luisa: 0,
  Jesus: 0,
  Gabriel: 0,
  Karla: 0,
};
var canRegister = true; // Variable para controlar si se puede registrar una persona

navigator.getMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

const cargarCamera = () => {
  navigator.getMedia(
    // Restricciones (constraints) *Requerido
    {
      video: true,
      audio: false,
    },
    (stream) => (elVideo.srcObject = stream),
    console.error
  );
};

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
]).then(cargarCamera);

function updateRegisteredPeopleList() {
  const registeredList = document.getElementById("registered-list");
  registeredList.innerHTML = "";
  registeredPeople.forEach((person) => {
    const { name, Edad, Genero } = person;
    const row = registeredList.insertRow();
    row.insertCell(0).textContent = name;
    row.insertCell(1).textContent = Edad;
    row.insertCell(2).textContent = Genero;
  });
}

elVideo.addEventListener("play", async () => {
  // Crea el canvas con los elementos del Face API
  const canvas = faceapi.createCanvasFromMedia(elVideo);

  canvas.willReadFrequently = true;
  document.body.append(canvas);

  // Tamaño del canvas
  const displaySize = { width: elVideo.width, height: elVideo.height };
  faceapi.matchDimensions(canvas, displaySize);

  // Carga las imágenes de las personas conocidas
  const labeledFaceDescriptors = await loadLabeledImages();

  setInterval(async () => {
    // Realiza las detecciones
    const detections = await faceapi
      .detectAllFaces(elVideo)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    // Limpia el canvas
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja las líneas
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    resizedDetections.forEach(async (detection) => {
      const {
        descriptor,
        age,
        gender,
        detection: { box },
      } = detection;

      const faceMatcher = new faceapi.FaceMatcher(
        labeledFaceDescriptors,
        0.99
      );
      const bestMatch = faceMatcher.findBestMatch(descriptor);

      let fullName = "";
      let Edad = "";
      let Genero = "";
      let photoSrc = ""; // Variable para almacenar la fuente de la foto

      // Define el nombre completo, la edad y el genero según la etiqueta detectada
      switch (bestMatch.label) {
        case "Luisa":
          fullName = "Luisa Daniela Schlenker Enriquez"; // Reemplaza con el nombre completo real
          Edad = "26"; //edad
          Genero = "Femenino"; //genero de la persona
          photoSrc = "fotos/Luisa/3.jpg"; // Ruta de la foto
          break;
        case "Jesus":
          fullName = "Jesus Antonio Calderas Lemus"; // Reemplaza con el nombre completo real
          Edad = "22";
          Genero = "Masculino"; //genero de la persona
          photoSrc = "fotos/Jesus/2.jpg"; // Ruta de la foto
          break;

        case "Gabriel":
          fullName = "Pablo Gabriel Choj Vega"; // Reemplaza con el nombre completo real
          Edad = "24"; //edad
          Genero = "Masculino"; //genero de la persona
          photoSrc = "fotos/Gabriel/8.jpg"; // Ruta de la foto
          break;
        case "Karla":
          fullName = "Karla Mishel Flores Velasquez"; // Reemplaza con el nombre completo real
          Edad = "27"; //edad
          Genero = "Masculino"; //genero de la persona
          photoSrc = "fotos/Karla/1.jpg"; // Ruta de la foto
          break;
        
        // Agrega más casos para otras personas conocidas
        default:
          fullName = "No se encuentra Datos";
          Edad = "N/A";
          break;
      }

      // Imprime el nombre completo  de la persona detectada en el label
      document.getElementById("label").textContent = `${fullName}`;
      document.getElementById("label2").textContent = `Edad: ${Edad}`;
      document.getElementById("label3").textContent = `Genero: ${Genero}`;

      const drawBox = new faceapi.draw.DrawBox(box, {
        label: `${fullName} - Edad: ${Edad} (${Math.round(
          age
        )} años, ${gender})`,
      });

      // Dibuja el cuadro con el nombre
      drawBox.draw(canvas);

      if (photoSrc) {
        const photoElement = document.getElementById("photo");
        photoElement.src = photoSrc;
        photoElement.style.display = "block";
      } else {
        // Oculta la foto si no se encontró una ruta de foto válida
        const photoElement = document.getElementById("photo");
        photoElement.style.display = "none";
      }

      if (
        fullName !== "No se encuentra en la sección" &&
        !registeredPeople.some((person) => person.Edad === Edad) &&
        canRegister
      ) {
        // Si la persona no está en la lista de registradas y se puede registrar, agrégala
        registeredPeople.push({ name: fullName, Edad, Genero });
        updateRegisteredPeopleList();
        console.log("Registrado a", fullName);

        // Deshabilita el registro durante 10 segundos y muestra la cuenta regresiva
        canRegister = false;
        startCountdown(10); // Inicia la cuenta regresiva de 10 segundos
      }
    });
  });
});

async function loadLabeledImages() {
  var contador = 0;
  const labels = [
    "Luisa",
    "Jesus",
    "Gabriel",
    "Karla",
    
  ]; // Nombres de las personas conocidas
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 1; i++) {
        // Se recomienda cargar 3 o más imágenes por persona
        const img = await faceapi.fetchImage(`fotos/${label}/${i}.jpg`); // Ruta de la imagen
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

// Función para iniciar la cuenta regresiva
function startCountdown(seconds) {
  const countdownElement = document.getElementById("countdown");
  countdownElement.style.display = "block";
  countdownElement.textContent = `Espera ${seconds} segundos para registrar nuevamente`;

  const interval = setInterval(() => {
    seconds -= 1;
    if (seconds > 0) {
      countdownElement.textContent = `Espera ${seconds} segundos para registrar nuevamente`;
    } else {
      clearInterval(interval);
      countdownElement.style.display = "none";
      canRegister = true;
    }
  }, 1000);
}

// Función para descargar la tabla de asistencia en un archivo CSV
function downloadCSV() {
  const table = document.getElementById("registered-list");
  const rows = table.querySelectorAll("tr");

  // Crear contenido CSV
  let csvContent = "data:text/csv;charset=utf-8,";
  rows.forEach((row) => {
    const cols = row.querySelectorAll("th, td");
    const rowData = [];
    cols.forEach((col) => {
      rowData.push(col.textContent);
    });
    csvContent += rowData.join(",") + "\n";
  });

  // Crear un elemento de enlace para descargar el archivo
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "asistencia.csv");
  document.body.appendChild(link);

  // Simular un clic en el enlace para descargar el archivo
  link.click();
}

// Agregar un evento de clic al botón de descarga
const downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click", downloadCSV);
