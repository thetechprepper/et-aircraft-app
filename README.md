# et-aircraft-app

et-aircraft-app is a front-end application for the dump1090 program and
is designed specifically to work with a suite of services provided by
EmComm Tools Community (ETC) R5 build.

It is implemented using an offline-first approach and relies on the 
offline mapping subsystem built into ETC. This mapping subsystem is
built on top of the mbtileserver and use pre-rendered raster tiles that
are packed in the `.mbtiles` format.

When used with ETC, the application offers a plug-and-play experience.
Simply plug in a supported SDR and click the airplane icon in the 
launcher.
