#ifndef SIMPLE_CV_DECODE_IMAGE_H
#define SIMPLE_CV_DECODE_IMAGE_H

#include "Matrix.h"
#include "async.h"

/**
 * decodeImage(image)
 * decodeImage(image, callback)
 * decodeImage(image, decodeType)
 * decodeImage(image, decodeType, callback)
 */
NAN_METHOD(decodeImage) {
  int decodeType = cv::IMREAD_UNCHANGED;

  if (info.Length() < 1 || info.Length() > 3) {
    Nan::ThrowError("expected at least one argument (data) and at most three arguments (data, decodeType, callback)");
    return;
  }

  if (!node::Buffer::HasInstance(info[0])) {
    Nan::ThrowError("first argument (data) must be a Buffer");
    return;
  }

  if (info.Length() >= 2) {
    if (info[1]->IsInt32()) {
      int depth = Nan::To<int>(info[1]).FromJust();

      if (depth == ImageTypeGray) {
        decodeType = cv::IMREAD_GRAYSCALE;
      } else if (depth == ImageTypeBGR) {
        decodeType = cv::IMREAD_COLOR;
      } else if (depth == ImageTypeBGRA) {
        decodeType = cv::IMREAD_UNCHANGED;
      } else {
        Nan::ThrowError("second argument (decodeType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
        return;
      }
    } else if (!info[1]->IsFunction()) {
      Nan::ThrowError("second argument (decodeType) must be a one of [cv.ImageType.Gray, cv.ImageType.BGR, cv.ImageType.BGRA]");
      return;
    }
  }

  if (info.Length() == 3 && !info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  auto bytes = reinterpret_cast<uchar*>(node::Buffer::Data(info[0]));
  auto size = node::Buffer::Length(info[0]);
  std::vector<uchar> data(bytes, bytes + size);

  maybeAsyncOp<cv::Mat>(info, [data, decodeType]() {
    auto image = cv::imdecode(data, decodeType);

    if (image.empty()) {
      throw std::runtime_error("invalid image data");
    }

    return image;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_DECODE_IMAGE_H
