{pkgs, ...}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.openjdk17 # Added Java for Firebase Emulators
  ];
  idx.extensions = [];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
