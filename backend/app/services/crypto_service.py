from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import os
import logging

logger = logging.getLogger(__name__)

class CryptoService:
    @staticmethod
    def generate_key_pair():
        logger.info("Generating RSA key pair (2048-bit)")
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )

        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        logger.info("Key pair generated successfully")
        return {
            "private_key": private_pem,
            "public_key": public_pem
        }

    @staticmethod
    def encrypt_message(message: str, public_key_pem: str) -> str:
        msg_length = len(message)
        logger.info(f"Encrypting message (length: {msg_length} chars)")

        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )

        encrypted = public_key.encrypt(
            message.encode('utf-8'),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')
        logger.info(f"Encryption successful (encrypted size: {len(encrypted_b64)} chars)")
        return encrypted_b64

    @staticmethod
    def decrypt_message(encrypted_message: str, private_key_pem: str) -> str:
        logger.info(f"Decrypting message (encrypted size: {len(encrypted_message)} chars)")

        try:
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None,
                backend=default_backend()
            )

            encrypted_bytes = base64.b64decode(encrypted_message)

            decrypted = private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )

            decrypted_text = decrypted.decode('utf-8')
            logger.info(f"Decryption successful (decrypted length: {len(decrypted_text)} chars)")
            return decrypted_text
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise

    @staticmethod
    def encrypt_private_key(private_key_pem: str, password: str) -> str:
        """Encrypt private key using password-based encryption (AES-256-GCM)"""
        logger.info("Encrypting private key with password")

        # Generate a random salt
        salt = os.urandom(16)

        # Derive encryption key from password using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits for AES-256
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(password.encode('utf-8'))

        # Generate a random IV
        iv = os.urandom(12)  # GCM standard IV size

        # Encrypt the private key
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(private_key_pem.encode('utf-8')) + encryptor.finalize()

        # Combine salt + iv + tag + ciphertext and encode as base64
        encrypted_data = salt + iv + encryptor.tag + ciphertext
        encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')

        logger.info("Private key encrypted successfully")
        return encrypted_b64

    @staticmethod
    def decrypt_private_key(encrypted_private_key: str, password: str) -> str:
        """Decrypt private key using password"""
        logger.info("Decrypting private key with password")

        try:
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_private_key)

            # Extract components
            salt = encrypted_data[:16]
            iv = encrypted_data[16:28]
            tag = encrypted_data[28:44]
            ciphertext = encrypted_data[44:]

            # Derive decryption key from password
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = kdf.derive(password.encode('utf-8'))

            # Decrypt the private key
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv, tag),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            private_key_pem = decryptor.update(ciphertext) + decryptor.finalize()

            logger.info("Private key decrypted successfully")
            return private_key_pem.decode('utf-8')
        except Exception as e:
            logger.error(f"Private key decryption failed: {str(e)}")
            raise
