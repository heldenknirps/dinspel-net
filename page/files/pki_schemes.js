const rawPKIschemes = `
Scheme,sk,pk,ct,nist-sec-level,kem, link
ML-KEM,1632,800,768,1,1,"https://csrc.nist.gov/pubs/fips/203/final"
HQC,7317,7245,14485,5,1,"https://pqc-hqc.org/"
ECDHE,,,,classic,0,"https://www.ecdhe.com/"
FFDHE,,,,classic,0,"https://datatracker.ietf.org/doc/html/rfc7919"
RSA,,,,classic,0,"https://de.wikipedia.org/wiki/RSA-Kryptosystem"
RSA-OAEP,,,,classic,0,"https://de.wikipedia.org/wiki/Optimal_Asymmetric_Encryption_Padding"
FrodoKEM,,,,classic,1,"https://frodokem.org/"
X-Wing,,,,classic,1,"https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/"
`;
