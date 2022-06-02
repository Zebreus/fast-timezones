{ pkgs ? import <nixpkgs> {} }:
with pkgs;
mkShell {
  nativeBuildInputs = [ 
    nodejs-17_x
    yarn
    git
  ];
  shellHook = with pkgs; ''
    export PATH=${toString ./.}/node_modules/.bin:$PATH
    yarn install
  '';
}
