#ifndef SIMPLE_CV_SPLIT_H
#define SIMPLE_CV_SPLIT_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(split) {
  if (info.Length() < 1 || info.Length() > 2) {
    Nan::ThrowError("expected at least one argument (image) and at most two arguments (image, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);

  maybeAsyncOp<std::vector<cv::Mat>>(info, [image]() {
    std::vector<cv::Mat> channels;
    cv::split(image, channels);
    return channels;
  }, [](const std::vector<cv::Mat>& channels) {
    auto array = Nan::New<v8::Array>(channels.size());

    for (unsigned i = 0; i < channels.size(); ++i) {
      Nan::Set(array, i, Matrix::create(channels[i]));
    }

    return array;
  });
}

#endif // SIMPLE_CV_SPLIT_H
