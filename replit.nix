{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.libxcrypt
    pkgs.run
  ];
}
