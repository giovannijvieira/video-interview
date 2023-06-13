<template>
  <div class="video-recorder-container">
    <div class="video-container" v-show="!interviewCompleted">
      <video ref="videoElement" width="640" height="480" autoplay></video>
      <div class="red-light" :class="{ 'blinking': recording }"></div>
    </div>
    <div class="question-container" v-show="!interviewCompleted">
      <p class="question">{{ question }}</p>
    </div>
    <div class="controls-container">
      <button @click="toggleRecording" v-show="!interviewCompleted">
        {{ recording ? 'Parar' : 'Gravar' }}
      </button>
      <p v-show="!interviewCompleted">{{ remainingTime }} segundos restantes</p>
      <button @click="nextQuestion" v-show="!recording && !interviewCompleted && hasNextQuestion">Próxima Pergunta</button>
      <div class="interview-completed" v-show="interviewCompleted">
        <p>Obrigado por participar! Entraremos em contato em breve.</p>
        <button @click="downloadRecordedVideo">Baixar Vídeo</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import './VideoRecorder.css';
import { ref, watch, onUnmounted, computed } from 'vue';

export default {
  setup() {
    const questions = ref([
      "O que você sabe sobre nós como uma empresa?",
      "Quais são seus pontos fortes?"
    ]);
    const questionIndex = ref(0);
    const recording = ref(false);
    const remainingTime = ref(60);
    let timerInterval: number | null = null;
    let recordedVideoBlob: Blob | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    const videoElement = ref<HTMLVideoElement | null>(null);
    const interviewCompleted = ref(false);

    const toggleRecording = async () => {
      if (!recording.value) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoElement.value) {
            videoElement.value.srcObject = stream;
            videoElement.value.play();
          }
          const chunks: Blob[] = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };
          mediaRecorder.onstop = () => {
            recordedVideoBlob = new Blob(chunks, { type: 'video/webm' });
            if (recordedVideoBlob) {
              if (questionIndex.value === questions.value.length - 1) {
                downloadVideo(recordedVideoBlob);
              }
              uploadVideo(recordedVideoBlob);
            }
            if (videoElement.value && recordedVideoBlob) {
              videoElement.value.src = URL.createObjectURL(recordedVideoBlob);
              videoElement.value.play();
            }
          };
          mediaRecorder.start();
          recording.value = true;
          timerInterval = setInterval(() => {
            remainingTime.value--;
            if (remainingTime.value === 0) {
              toggleRecording();
            }
          }, 1000);
        } catch (error) {
          console.error('Erro ao acessar a câmera:', error);
        }
      } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        recording.value = false;
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        if (questionIndex.value === questions.value.length - 1) {
          interviewCompleted.value = true;
        } else {
          questionIndex.value++;
        }
      }
    };

    const downloadVideo = (videoBlob: Blob) => {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'interview_video.webm';
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    const uploadVideo = (videoBlob: Blob) => {
      const formData = new FormData();
      formData.append('video', videoBlob, 'interview_video.webm');

      fetch('http://localhost/upload.php', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            console.log('Vídeo enviado com sucesso!');
          } else {
            console.error('Falha ao enviar o vídeo.');
          }
        })
        .catch((error) => {
          console.error('Ocorreu um erro durante o envio do vídeo:', error);
        });
    };

    watch(recording, (value) => {
      if (!value) {
        remainingTime.value = 60;
      }
    });

    onUnmounted(() => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });

    const question = computed(() => questions.value[questionIndex.value]);

    const hasNextQuestion = computed(() => questionIndex.value < questions.value.length - 1);

    const nextQuestion = () => {
      if (!recording.value) {
        if (questionIndex.value === questions.value.length - 1) {
          interviewCompleted.value = true;
        } else {
          questionIndex.value++;
        }
      }
    };

    const downloadRecordedVideo = () => {
      if (recordedVideoBlob) {
        downloadVideo(recordedVideoBlob);
      }
    };

    return {
      question,
      recording,
      remainingTime,
      toggleRecording,
      videoElement,
      interviewCompleted,
      hasNextQuestion,
      nextQuestion,
      downloadRecordedVideo,
    };
  },
};
</script>
