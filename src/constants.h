#ifndef SIMPLE_CV_CONSTANTS_H
#define SIMPLE_CV_CONSTANTS_H

#include <nan.h>
#include <opencv2/opencv.hpp>

static const int ImageTypeGray = CV_8UC1;
static const int ImageTypeBGR = CV_8UC3;
static const int ImageTypeBGRA = CV_8UC4;
static const int ImageTypeFloat = CV_64F;

static const int EncodeTypePNG = 0;
static const int EncodeTypeJPEG = 1;

static const int ChannelGray = 0;
static const int ChannelRed = 1;
static const int ChannelGreen = 2;
static const int ChannelBlue = 3;
static const int ChannelAlpha = 4;
static const int ChannelFloat = 5;

static const int BorderTypeReplicate = cv::BORDER_REPLICATE;
static const int BorderTypeReflect = cv::BORDER_REFLECT;
static const int BorderTypeReflect101 = cv::BORDER_REFLECT101;
static const int BorderTypeWrap = cv::BORDER_WRAP;
static const int BorderTypeConstant = cv::BORDER_CONSTANT;

static const int ConversionBGRToGray = cv::COLOR_BGR2GRAY;
static const int ConversionGrayToBGR = cv::COLOR_GRAY2BGR;

NAN_MODULE_INIT(initConstants) {
  auto ImageType = Nan::New<v8::Object>();
  auto EncodeType = Nan::New<v8::Object>();
  auto BorderType = Nan::New<v8::Object>();
  auto Channel = Nan::New<v8::Object>();
  auto Conversion = Nan::New<v8::Object>();

  Nan::Set(ImageType, Nan::New("Gray").ToLocalChecked(), Nan::New(ImageTypeGray));
  Nan::Set(ImageType, Nan::New("BGR").ToLocalChecked(), Nan::New(ImageTypeBGR));
  Nan::Set(ImageType, Nan::New("BGRA").ToLocalChecked(), Nan::New(ImageTypeBGRA));
  Nan::Set(ImageType, Nan::New("Float").ToLocalChecked(), Nan::New(ImageTypeFloat));

  Nan::Set(EncodeType, Nan::New("PNG").ToLocalChecked(), Nan::New(EncodeTypePNG));
  Nan::Set(EncodeType, Nan::New("JPEG").ToLocalChecked(), Nan::New(EncodeTypeJPEG));

  Nan::Set(BorderType, Nan::New("Replicate").ToLocalChecked(), Nan::New(BorderTypeReplicate));
  Nan::Set(BorderType, Nan::New("Reflect").ToLocalChecked(), Nan::New(BorderTypeReflect));
  Nan::Set(BorderType, Nan::New("Reflect101").ToLocalChecked(), Nan::New(BorderTypeReflect101));
  Nan::Set(BorderType, Nan::New("Wrap").ToLocalChecked(), Nan::New(BorderTypeWrap));
  Nan::Set(BorderType, Nan::New("Constant").ToLocalChecked(), Nan::New(BorderTypeConstant));

  Nan::Set(Channel, Nan::New("Gray").ToLocalChecked(), Nan::New(ChannelGray));
  Nan::Set(Channel, Nan::New("Red").ToLocalChecked(), Nan::New(ChannelRed));
  Nan::Set(Channel, Nan::New("Green").ToLocalChecked(), Nan::New(ChannelGreen));
  Nan::Set(Channel, Nan::New("Blue").ToLocalChecked(), Nan::New(ChannelBlue));
  Nan::Set(Channel, Nan::New("Alpha").ToLocalChecked(), Nan::New(ChannelAlpha));
  Nan::Set(Channel, Nan::New("Float").ToLocalChecked(), Nan::New(ChannelFloat));

  Nan::Set(Conversion, Nan::New("BGRToGray").ToLocalChecked(), Nan::New(ConversionBGRToGray));
  Nan::Set(Conversion, Nan::New("GrayToBGR").ToLocalChecked(), Nan::New(ConversionGrayToBGR));

  Nan::Set(target, Nan::New("ImageType").ToLocalChecked(), ImageType);
  Nan::Set(target, Nan::New("EncodeType").ToLocalChecked(), EncodeType);
  Nan::Set(target, Nan::New("BorderType").ToLocalChecked(), BorderType);
  Nan::Set(target, Nan::New("Channel").ToLocalChecked(), Channel);
  Nan::Set(target, Nan::New("Conversion").ToLocalChecked(), Conversion);
}

#endif //SIMPLE_CV_CONSTANTS_H
