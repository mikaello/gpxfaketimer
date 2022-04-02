# Demo - gpxfaketimer

Transpile code and start server:

```shell
yarn install
yarn start
```

You can now open [http://localhost:8080](http://localhost:8080) and start
testing gpxfaketimer (if using cURL, you will need to add the `--compressed`
arg, because [servor](https://github.com/lukejacksonn/servor) serves gzipped
since v3.3.1).

To continuously watch files for changes, you need to start Gulp (in another
tab):

```shell
yarn dev
```

When `yarn dev` is ran, Gulp will start and you can change code in both this
folder (_example_) and in the library (one up (`../src/*.ts`)). Gulp is watching
changes for all TS-files, and will start the correct task according to which
file is changed. The server will automatically reload when files are changed.
