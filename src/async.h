#ifndef SIMPLE_CV_ASYNC_H
#define SIMPLE_CV_ASYNC_H

#include <nan.h>
#include <opencv2/opencv.hpp>
#include "Matrix.h"

template<typename T>
class AsyncOp : public Nan::AsyncWorker {

public:

  AsyncOp(std::function<T(void)> worker,
          std::function<v8::Local<v8::Value>(const T&)> outputMapper,
          Nan::Callback *callback)
      : AsyncWorker(callback)
      , worker(worker)
      , outputMapper(outputMapper) {
  }

  virtual void Execute() {
    try {
      output = worker();
    } catch (std::exception& err) {
      SetErrorMessage(err.what());
    }
  }

  virtual ~AsyncOp() {}

protected:

  virtual void HandleOKCallback() {
    Nan::HandleScope scope;

    try {
      v8::Local<v8::Value> args[] = {Nan::Null(), outputMapper(output)};
      callback->Call(2, args);
    } catch (std::exception& err) {
      v8::Local<v8::Value> args[] = {Nan::Error(err.what()), Nan::Null()};
      callback->Call(2, args);
    }
  }

private:

  std::function<T(void)> worker;
  std::function<v8::Local<v8::Value>(T)> outputMapper;
  T output;

};

inline void asyncImageOp(v8::Local<v8::Function> callback, std::function<cv::Mat(void)> worker) {
  Nan::HandleScope scope;

  Nan::AsyncQueueWorker(new AsyncOp<cv::Mat>(
      worker,
      [](const cv::Mat& mat) {
        return Matrix::create(mat);
      },
      new Nan::Callback(callback)
  ));
}

inline void asyncOp(v8::Local<v8::Function> callback, std::function<void(void)> worker) {
  Nan::HandleScope scope;

  Nan::AsyncQueueWorker(new AsyncOp<int>(
      [worker]() {
        worker();
        return 0;
      },
      [](const int&) {
        return Nan::Null();
      },
      new Nan::Callback(callback)
  ));
}

template<typename T>
inline void asyncOp(v8::Local<v8::Function> callback, std::function<T(void)> worker, std::function<v8::Local<v8::Value>(T)> outputMapper) {
  Nan::HandleScope scope;

  Nan::AsyncQueueWorker(new AsyncOp<T>(
      worker,
      outputMapper,
      new Nan::Callback(callback)
  ));
}

#endif //SIMPLE_CV_ASYNC_H
