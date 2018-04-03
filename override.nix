let
  bootstrap = import <nixpkgs> {};

  # nixpkgs with chromium 64
  nixpkgs = with builtins; fromJSON (readFile ./nixpkgs.json);

  src = bootstrap.fetchFromGitHub {
    owner = "NixOS";
    repo  = "nixpkgs";
    inherit (nixpkgs) rev sha256;
  };
  pkgs = import src { config = {}; };

  nodePackages = import ./default.nix { inherit pkgs; };
  nst = nodePackages.package.overrideAttrs ( attrs: { 
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true;
  });


  importNixPkgs = { rev, sha256 }:
    import (fetchNixPkgs { inherit rev sha256; }) { config = {}; };

  fetchNixPkgs = { rev, sha256 }:
    pkgs.fetchFromGitHub {
        inherit rev sha256;
        owner = "NixOS";
        repo  = "nixpkgs-channels";
    };

  chromium = pkgs.chromium.overrideAttrs (attrs: { channel = "dev"; });
in
  pkgs.stdenv.mkDerivation {
    name = "nst";
    src = ./.;
    buildInputs = [ chromium ];
    installPhase = ''
      cp -r ${nst} $out
    '';
  }
