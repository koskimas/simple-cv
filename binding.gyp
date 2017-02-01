{
  "targets": [
    {
      "target_name": "simple_cv",
      "sources": [
        "src/simple-cv.cpp",
      ],

      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "src",
        "/usr/local/include"
      ],

      "libraries+": [
        "-lopencv_core",
        "-lopencv_imgproc",
        "-lopencv_highgui"
      ],

      "conditions": [
        ['OS=="linux"', {
          "cflags+": ["-O3"],
          "cflags_cc+": ["-O3"],
          "cflags!": ["-fno-exceptions", "-fno-rtti"],
          "cflags_cc!": ["-fno-exceptions", "-fno-rtti"]
        }],

        ['OS=="mac"', {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
            "OTHER_CFLAGS": [
              "-std=c++11",
              "-stdlib=libc++",
              "-O3",
              "-I/usr/local/opt/opencv3/include"
            ],
            "OTHER_LDFLAGS": [
              "-L/usr/local/opt/opencv3/lib"
            ],
            "MACOSX_DEPLOYMENT_TARGET": "10.11"
          }
        }]
      ]
    }
  ]
}