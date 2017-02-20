#ifndef SIMPLE_CV_READIMAGE_H
#define SIMPLE_CV_READIMAGE_H

#include "Matrix.h"
#include "async.h"
#include "constants.h"

/**
 * readImage(filePath)
 * readImage(filePath, callback)
 * readImage(filePath, readType)
 * readImage(filePath, readType, callback)
 */
NAN_METHOD(readImage) {
  int readType = cv::IMREAD_UNCHANGED;

  if (info.Length() < 1 || info.Length() > 3) {
    Nan::ThrowError("expected at least one argument (filePath) and at most three arguments (filePath, readType, callback)");
    return;
  }

  if (!info[0]->IsString()) {
    Nan::ThrowError("first argument (filePath) must be a string");
    return;
  }

  if (info.Length() >= 2) {
    if (info[1]->IsInt32()) {
      int depth = Nan::To<int>(info[1]).FromJust();

      if (depth == ImageTypeGray) {
        readType = cv::IMREAD_GRAYSCALE;
      } else if (depth == ImageTypeBGR) {
        readType = cv::IMREAD_COLOR;
      } else if (depth == ImageTypeBGRA) {
        readType = cv::IMREAD_UNCHANGED;
      } else {
        Nan::ThrowError("second argument (readType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
        return;
      }
    } else if (!info[1]->IsFunction()) {
      Nan::ThrowError("second argument (readType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }
  }

  if (info.Length() == 3 && !info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  std::string filePath(v8::String::Utf8Value(info[0]->ToString()).operator*());

  maybeAsyncOp<cv::Mat>(info, [filePath, readType]() {
    auto image = cv::imread(filePath, readType);

    if (image.empty()) {
      throw std::runtime_error(std::string("invalid image file ") + "\"" + filePath + "\"");
    }

    return image;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif //SIMPLE_CV_READIMAGE_H
