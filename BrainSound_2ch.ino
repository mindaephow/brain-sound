// 브레인 사운드 - 2채널 뇌파 펌웨어 (아두이노 우노 + BioAmp EXG Pill x2)
//
// 하는 일
//   - A0(왼쪽 이마), A1(오른쪽 이마)을 1초에 256번씩 일정하게 읽는다
//   - 채널마다 EEG 대역통과 필터(0.5~29.5Hz)를 적용한다
//   - 시리얼(115200bps)로 "왼쪽,오른쪽" 한 줄씩 보낸다
//
// 배선
//   Pill1 VCC -> 5V,  GND -> GND,  OUT -> A0   (왼쪽)
//   Pill2 VCC -> 5V,  GND -> GND,  OUT -> A1   (오른쪽)
//   !!! VCC와 GND를 거꾸로 꽂으면 보드가 탑니다. 꽂기 전에 꼭 확인 !!!
//
// 샘플링 방식과 필터 계수는 Upside Down Labs의 공식 예제
// (FixedSampling, EEGFilter, MIT 라이선스)를 바탕으로 했다.
// https://github.com/upsidedownlabs/BioAmp-EXG-Pill
// Copyright (c) 2021 Upside Down Labs - MIT License

#define SAMPLE_RATE 256      // 필터 계수가 256Hz 기준이라 256으로 맞춤
#define BAUD_RATE   115200
#define PIN_LEFT    A0
#define PIN_RIGHT   A1

// 4차 버터워스 대역통과 필터 (0.5~29.5Hz, 256Hz) - 채널마다 상태를 따로 가진다
struct EEGFilter {
  float z[4][2] = {{0, 0}, {0, 0}, {0, 0}, {0, 0}};

  float process(float input) {
    float out = input, x;

    x = out - -0.95391350 * z[0][0] - 0.25311356 * z[0][1];
    out = 0.00735282 * x + 0.01470564 * z[0][0] + 0.00735282 * z[0][1];
    z[0][1] = z[0][0]; z[0][0] = x;

    x = out - -1.20596630 * z[1][0] - 0.60558332 * z[1][1];
    out = 1.0 * x + 2.0 * z[1][0] + 1.0 * z[1][1];
    z[1][1] = z[1][0]; z[1][0] = x;

    x = out - -1.97690645 * z[2][0] - 0.97706395 * z[2][1];
    out = 1.0 * x + -2.0 * z[2][0] + 1.0 * z[2][1];
    z[2][1] = z[2][0]; z[2][0] = x;

    x = out - -1.99071687 * z[3][0] - 0.99086813 * z[3][1];
    out = 1.0 * x + -2.0 * z[3][0] + 1.0 * z[3][1];
    z[3][1] = z[3][0]; z[3][0] = x;

    return out;
  }
};

EEGFilter filterLeft;
EEGFilter filterRight;

void setup() {
  Serial.begin(BAUD_RATE);
}

void loop() {
  // micros() 기반 타이머: 3906마이크로초(=1/256초)마다 한 번씩 측정
  static unsigned long past = 0;
  unsigned long present = micros();
  unsigned long interval = present - past;
  past = present;

  static long timer = 0;
  timer -= interval;

  if (timer < 0) {
    timer += 1000000L / SAMPLE_RATE;

    int rawLeft  = analogRead(PIN_LEFT);
    int rawRight = analogRead(PIN_RIGHT);

    float left  = filterLeft.process(rawLeft);
    float right = filterRight.process(rawRight);

    Serial.print(left, 2);
    Serial.print(',');
    Serial.println(right, 2);
  }
}
