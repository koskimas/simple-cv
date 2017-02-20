#ifndef SIMPLE_CV_RESIZE_H
#define SIMPLE_CV_RESIZE_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"
#include "constants.h"

NAN_METHOD(resize) {
  cv::Size size;

  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two argument (image, sizeSpec) and at most three arguments (image, sizeSpec, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);
  v8::Local<v8::Value> sizeSpec = info[1];
  const double aspectRatio = static_cast<double>(image.size().height) / static_cast<double>(image.size().width);

  if (sizeSpec->IsInt32()) {
    int width = Nan::To<int>(sizeSpec).FromJust();

    if (width <= 0) {
      Nan::ThrowError("if the second argument (sizeSpec) is a number it must be a positive integer");
      return;
    }

    size.width = width;
    size.height = cvRound(width * aspectRatio);
  } else if (sizeSpec->IsObject()) {
    if (has(sizeSpec, "width")
        && has(sizeSpec, "height")
        && getValue(sizeSpec, "width")->IsInt32()
        && getValue(sizeSpec, "height")->IsInt32()) {

      size.width = get<int>(sizeSpec, "width");
      size.height = get<int>(sizeSpec, "height");

      if (size.width <= 0 || size.height <= 0) {
        Nan::ThrowError("width and height must be a positive integers");
        return;
      }
    } else if (has(sizeSpec, "width") && getValue(sizeSpec, "width")->IsInt32()) {
      size.width = get<int>(sizeSpec, "width");

      if (size.width <= 0) {
        Nan::ThrowError("width must be a positive integer");
        return;
      }

      size.height = cvRound(size.width * aspectRatio);
    } else if (has(sizeSpec, "height") && getValue(sizeSpec, "height")->IsInt32()) {
      size.height = get<int>(sizeSpec, "height");

      if (size.height <= 0) {
        Nan::ThrowError("height must be a positive integer");
        return;
      }

      size.width = cvRound(size.height / aspectRatio);
    } else if (has(sizeSpec, "scale") && getValue(sizeSpec, "scale")->IsNumber()) {
      double scale = get<double>(sizeSpec, "scale");

      if (scale <= 0) {
        Nan::ThrowError("scale must be positive floating point number");
        return;
      }

      size.width = cvRound(image.size().width * scale);
      size.height = cvRound(image.size().height * scale);
    } else if (has(sizeSpec, "xScale")
        && has(sizeSpec, "yScale")
        && getValue(sizeSpec, "xScale")->IsNumber()
        && getValue(sizeSpec, "yScale")->IsNumber()) {

      double xScale = get<double>(sizeSpec, "xScale");
      double yScale = get<double>(sizeSpec, "yScale");

      if (xScale <= 0 || yScale <= 0) {
        Nan::ThrowError("xScale and yScale must be positive floating point numbers");
        return;
      }

      size.width = cvRound(image.size().width * xScale);
      size.height = cvRound(image.size().height * yScale);
    } else {
      Nan::ThrowError("second argument (sizeSpec) must be a valid sizeSpec object");
      return;
    }
  } else {
    Nan::ThrowError("second argument (sizeSpec) must be an integer or an object");
    return;
  }

  if (info.Length() == 3 && !info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  maybeAsyncOp<cv::Mat>(info, [size, image]() {
    cv::Mat output = image.clone();

    if (image.empty()) {
      return output;
    }

    if (size.width > output.cols) {
      while (output.cols * 2 <= size.width) {
        cv::pyrUp(output, output);
      }
    } else {
      while (output.cols / 2 >= size.width) {
        cv::pyrDown(output, output);
      }
    }

    if (output.cols != size.width || output.rows != size.height) {
      cv::resize(output, output, size, 0, 0, cv::INTER_CUBIC);
    }

    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_RESIZE_H
