#ifndef SIMPLE_CV_READIMAGE_H
#define SIMPLE_CV_READIMAGE_H

#include "Matrix.h"
#include "async.h"
#include "constants.h"

NAN_METHOD(readImage) {
  int readType = cv::IMREAD_UNCHANGED;

  if (info.Length() < 2) {
    Nan::ThrowError("expected two (filePath, callback) or three (filePath, readType, callback) arguments");
    return;
  }

  if (!info[0]->IsString()) {
    Nan::ThrowError("first argument (filePath) must be a string");
    return;
  }

  if (info.Length() == 2 && !info[1]->IsFunction()) {
    Nan::ThrowError("second argument (callback) must be a function");
    return;
  }

  if (info.Length() >= 3) {
    if (!info[1]->IsInt32()) {
      Nan::ThrowError("second argument (depth) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }

    if (!info[2]->IsFunction()) {
      Nan::ThrowError("third argument (callback) must be a function");
      return;
    }

    int depth = Nan::To<int>(info[1]).FromJust();

    if (depth == ImageTypeGray) {
      readType = cv::IMREAD_GRAYSCALE;
    } else if (depth == ImageTypeBGR) {
      readType = cv::IMREAD_COLOR;
    } else if (depth == ImageTypeBGRA) {
      readType = cv::IMREAD_UNCHANGED;
    } else {
      Nan::ThrowError("second argument (depth) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }
  }

  std::string filePath(v8::String::Utf8Value(info[0]->ToString()).operator*());
  v8::Local<v8::Function> callback = (info.Length() == 2 ? info[1] : info[2]).As<v8::Function>();

  asyncImageOp(callback, [filePath, readType]() {
    auto image = cv::imread(filePath, readType);

    if (image.empty()) {
      throw std::runtime_error(std::string("invalid image file ") + "\"" + filePath + "\"");
    }

    return image;
  });
}

#endif //SIMPLE_CV_READIMAGE_H
