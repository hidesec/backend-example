/// <reference types="jest" />
import "reflect-metadata";
import { IUserRepository } from "repositories/user.repository.interface";
import { UserService } from "services/user.service";

describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let userService: UserService;

    beforeEach(() => {
        mockRepo = {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
        };
        userService = new UserService(mockRepo);
    });

    it("should create a new user", async () => {
        const dto = { name: "John Doe", email: "john.doe@example.com" };
        const user = { id: "1", name: "John Doe", email: "john.doe@example.com", createdAt: new Date() };
        mockRepo.save.mockResolvedValueOnce(user);

        const result = await userService.createUser(dto);
        expect(result.name).toBe(dto.name);
        expect(result.email).toBe(dto.email);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
});