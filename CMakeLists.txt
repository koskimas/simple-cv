cmake_minimum_required(VERSION 3.6)
project(simple_cv)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

if (APPLE)
    set(OPENCV_DIR /usr/local/opt/opencv3/)
elseif (UNIX)

endif()

include_directories(${OPENCV_DIR}/include ${PROJECT_SOURCE_DIR} node_modules/nan/ /usr/local/Cellar/node/7.4.0/include/node/)
link_directories(${OPENCV_DIR}/lib)
link_libraries(opencv_core opencv_imgproc opencv_highgui opencv_imcodecs)

set(SOURCE_FILES
        src/Matrix.h
        src/simple-cv.cpp
        src/async.h
        src/readImage.h
        src/writeImage.h
        src/showImage.h
        src/waitKey.h
        src/resize.h
        src/constants.h
        src/utils.h
        src/encodeImage.h
        src/decodeImage.h
        src/warpAffine.h
        src/rotationMatrix.h
        src/flipLeftRight.h
        src/flipUpDown.h)

add_library(simple_cv ${SOURCE_FILES})