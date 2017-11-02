#ifndef SIMPLE_CV_COLOR_TEMPERATURE_H
#define SIMPLE_CV_COLOR_TEMPERATURE_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"

uchar clamp(double val) {
  if (val < 0) {
    return 0;
  } else if (val > 255) {
    return 255;
  } else {
    return std::round(val);
  }
}

cv::Vec3b temperatureToBGR(double temp) {
  cv::Vec3b bgr;
  temp /= 100;

  if (temp <= 66) {
    bgr[2] = 255;
  } else {
    auto red = temp - 60;
    red = 329.698727446 * pow(red, -0.1332047592);
    bgr[2] = clamp(red);
  }

  if (temp <= 66) {
    auto green = temp;
    green = 99.4708025861 * log(green) - 161.1195681661;
    bgr[1] = clamp(green);
  } else {
    auto green = temp - 60;
    green = 288.1221695283 * pow(green, -0.0755148492);
    bgr[1] = clamp(green);
  }

  if (temp >= 66) {
    bgr[0] = 255;
  } else {
    auto blue = temp - 10;
    blue = 138.5177312231 * log(blue) - 305.0447927307;
    bgr[0] = clamp(blue);
  }

  return bgr;
}

NAN_METHOD(colorTemperature) {
  if (info.Length() < 3 || info.Length() > 4) {
    Nan::ThrowError("expected at least three argument (image, temperature, strength) and at most four arguments (image, temperature, strength, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  auto image = Matrix::get(info[0]);

  if (!info[1]->IsNumber()) {
    Nan::ThrowError("second argument (temperature) must be a number");
    return;
  }

  auto temperature = Nan::To<double>(info[1]).FromJust();

  if (temperature < 1000 || temperature > 40000) {
    Nan::ThrowError("second argument (temperature) must be between 1000K and 40000K");
    return;
  }

  if (!info[2]->IsNumber()) {
    Nan::ThrowError("third argument (strength) must be a number");
    return;
  }

  auto strength = Nan::To<double>(info[2]).FromJust();

  if (strength < 0 || strength > 1) {
    Nan::ThrowError("third argument (strength) must be between 0 and 1");
    return;
  }

  maybeAsyncOp<cv::Mat>(info, [image, temperature, strength]() {
    cv::Mat output;
    cv::Mat imageHLS;
    cv::Mat blendedBGR(image.rows, image.cols, image.type());
    cv::Mat blendedHLS;

    auto temperaturBGR = temperatureToBGR(temperature);

    cv::cvtColor(image, imageHLS, CV_BGR2HLS);

    for (int r = 0; r < image.rows; ++r) {
      for (int c = 0; c < image.cols; ++c) {
        auto bgr = image.at<cv::Vec3b>(r, c);
        auto alpha = strength * 0.5;

        blendedBGR.at<cv::Vec3b>(r, c) = alpha * temperaturBGR + (1 - alpha) * bgr;
      }
    }

    cv::cvtColor(blendedBGR, blendedHLS, CV_BGR2HLS);

    for (int r = 0; r < image.rows; ++r) {
      for (int c = 0; c < image.cols; ++c) {
        auto luminocity = imageHLS.at<cv::Vec3b>(r, c)[1];

        blendedHLS.at<cv::Vec3b>(r, c)[1] = luminocity;
      }
    }

    cv::cvtColor(blendedHLS, output, CV_HLS2BGR);

    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_COLOR_TEMPERATURE_H
