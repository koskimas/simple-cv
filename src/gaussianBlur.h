#ifndef SIMPLE_CV_GAUSSIAN_BLUR_H
#define SIMPLE_CV_GAUSSIAN_BLUR_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"

NAN_METHOD(gaussianBlur) {
  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two argument (image, opt) and at most three arguments (image, opt, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  auto image = Matrix::get(info[0]);
  auto kernelSize = cv::Size(3, 3);
  auto xSigma = 0.0;
  auto ySigma = 0.0;

  if (info[1]->IsObject() && !info[1]->IsFunction()) {
    auto opt = info[1];

    if (has(opt, "kernelSize")) {
      if (isSize(getValue(opt, "kernelSize"))) {
        kernelSize = getSize<int>(getValue(opt, "kernelSize"));
      } else {
        auto size = get<int>(opt, "kernelSize");
        kernelSize = cv::Size(size, size);
      }
    }

    if (has(opt, "xSigma")) {
      xSigma = ySigma = get<double>(opt, "xSigma");
    }

    if (has(opt, "ySigma")) {
      ySigma = get<double>(opt, "ySigma");
    }

    if (has(opt, "sigma")) {
      xSigma = ySigma = get<double>(opt, "sigma");
    }
  }

  maybeAsyncOp<cv::Mat>(info, [image, kernelSize, xSigma, ySigma]() {
    cv::Mat output;
    cv::GaussianBlur(image, output, kernelSize, xSigma, ySigma);
    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_GAUSSIAN_BLUR_H
