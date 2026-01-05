/**
 * 개발 환경에서만 로그를 출력하는 유틸리티
 * 프로덕션에서는 console.error만 출력하고 나머지는 무시
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 출력 (디버깅에 필수)
    console.error(...args);
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};
