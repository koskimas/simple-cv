#ifndef SIMPLE_CV_CONVERT_COLOR_H
#define SIMPLE_CV_CONVERT_COLOR_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(convertColor) {
  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two argument (image, conversion) and at most two arguments (image, conversion, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  if (!info[1]->IsInt32()) {
    Nan::ThrowError("second argument (conversion) must be one of [cv.Conversion.BGRToGray, cv.Conversion.GrayToBGR]");
    return;
  }

  auto image = Matrix::get(info[0]);
  auto conversion = Nan::To<int>(info[1]).FromJust();

  maybeAsyncOp<cv::Mat>(info, [image, conversion]() {
    cv::Mat output;
    cv::cvtColor(image, output, conversion);
    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_CONVERT_COLOR_H
